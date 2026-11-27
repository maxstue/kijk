using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Security;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore.Storage;

namespace Kijk.Application.Spaces.CreateInvitation;

/// <summary>
/// Invites one person into a shared space by unique name or by e-mail address.
/// </summary>
public sealed class CreateInvitationHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    IIdentityInvitations identityInvitations,
    IPseudonymizer pseudonymizer,
    TimeProvider timeProvider)
{
    /// <summary>
    /// Creates an invitation when the current user's role allows inviting. Personal spaces are never shared.
    /// </summary>
    /// <param name="spaceId">The space identifier.</param>
    /// <param name="request">The invited person and their role.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The invitation as the space admins see it.</returns>
    public async Task<Result<SpaceInvitationResponse>> HandleAsync(
        Guid spaceId,
        CreateSpaceInvitationRequest request,
        CancellationToken cancellationToken)
    {
        if (await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, SpacePermissions.Members.Invite, cancellationToken) is { } error)
        {
            return error;
        }

        var space = await dbContext.Spaces.SingleAsync(item => item.Id == spaceId, cancellationToken);
        if (space.IsPersonal)
        {
            return Error.Conflict("A personal space cannot be shared");
        }

        var role = await dbContext.Roles.SingleAsync(item => item.Id == (request.RoleId ?? SpaceRoles.Member.Id), cancellationToken);
        var creator = await dbContext.Users.SingleAsync(item => item.Id == currentUser.Id, cancellationToken);
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        // Match PostgreSQL timestamp precision so the first and repeated responses have the same expiry.
        utcNow = utcNow.AddTicks(-(utcNow.Ticks % TimeSpan.TicksPerMicrosecond));
        var context = new InvitationContext(space, role, creator, utcNow);

        return string.IsNullOrWhiteSpace(request.Email)
            ? await InviteByNameAsync(context, request.UniqueName!, cancellationToken)
            : await InviteByEmailAsync(context, request.Email.Trim(), cancellationToken);
    }

    private async Task<Result<SpaceInvitationResponse>> InviteByNameAsync(InvitationContext context, string uniqueName, CancellationToken cancellationToken)
    {
        if (!UniqueName.TryParse(uniqueName, out var name, out var tag))
        {
            return Error.Validation("A unique name looks like Max#4821");
        }

        // An exact match only, ignoring case through the column collation: the name is shared on purpose, so it may
        // report that nobody has it, but it never suggests other people.
        var invitee = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.Name == name && user.Tag == tag && user.OnboardingCompletedAt != null && user.DeletionRequestedAt == null)
            .Select(user => new { user.Id, user.AuthId, user.Name, user.Tag })
            .FirstOrDefaultAsync(cancellationToken);
        if (invitee is null)
        {
            return Error.NotFound("Nobody has this unique name");
        }

        if (invitee.Id == currentUser.Id)
        {
            return Error.Validation("You cannot invite yourself");
        }

        if (await dbContext.UserSpaces.AnyAsync(link => link.SpaceId == context.Space.Id && link.UserId == invitee.Id, cancellationToken))
        {
            return Error.Conflict("This person is already a member of the space");
        }

        var label = User.FormatUniqueName(invitee.Name, invitee.Tag);
        var invitation = await InviteIdentityAsync(context, invitee.AuthId, label, cancellationToken);
        return invitation is null
            ? Error.Conflict("This person already has a pending invitation to the space")
            : invitation.ToResponse();
    }

    private async Task<Result<SpaceInvitationResponse>> InviteByEmailAsync(InvitationContext context, string email, CancellationToken cancellationToken)
    {
        var fingerprint = InvitationEmail.Fingerprint(pseudonymizer, email);
        var submissions = dbContext.SpaceInvitations
            .Where(item => item.SpaceId == context.Space.Id && item.EmailFingerprint == fingerprint);
        var previous = await FindEmailSubmissionAsync(submissions, context.UtcNow, cancellationToken);
        if (previous is not null && !NeedsRecipient(previous))
        {
            return previous.ToResponse();
        }

        var authId = await identityInvitations.FindByVerifiedEmailAsync(email, cancellationToken);
        if (authId == currentUser.AuthId)
        {
            return Error.Validation("You cannot invite yourself");
        }

        if (previous is not null && authId is null)
        {
            return previous.ToResponse();
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var (invitation, created) = previous is null
            ? await ReserveEmailSubmissionAsync(context, submissions, email, fingerprint, cancellationToken)
            : (previous, false);

        if (created && authId is null)
        {
            await SendProviderInvitationAsync(invitation, email, transaction, cancellationToken);
        }
        else
        {
            if (authId is not null && NeedsRecipient(invitation))
            {
                await LinkExistingInviteeAsync(invitation, authId, context.UtcNow, cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
        }

        return invitation.ToResponse();
    }

    private async Task<(SpaceInvitation Invitation, bool Created)> ReserveEmailSubmissionAsync(
        InvitationContext context,
        IQueryable<SpaceInvitation> submissions,
        string email,
        string fingerprint,
        CancellationToken cancellationToken)
    {
        await submissions.CloseExpiredAsync(context.UtcNow, cancellationToken);
        var invitation = SpaceInvitation.ForEmail(context.Space, context.Role, context.Creator, EmailMask.Mask(email), fingerprint, context.UtcNow);
        dbContext.SpaceInvitations.Add(invitation);
        try
        {
            // Reserve the submission before sending, so concurrent requests cannot both send mail.
            await dbContext.SaveChangesAsync(cancellationToken);
            return (invitation, true);
        }
        catch (DbUpdateException)
        {
            dbContext.SpaceInvitations.Entry(invitation).State = EntityState.Detached;
            var concurrent = await FindEmailSubmissionAsync(submissions, context.UtcNow, cancellationToken);
            if (concurrent is null)
            {
                throw;
            }

            return (concurrent, false);
        }
    }

    private async Task SendProviderInvitationAsync(
        SpaceInvitation invitation, string email, IDbContextTransaction transaction, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        // Once sending starts, retain the returned provider ID even if the caller disconnects.
        var providerId = await identityInvitations.InviteAsync(email, invitation.Id, SpaceInvitation.Lifetime, CancellationToken.None);
        invitation.AttachProviderInvitation(providerId);
        try
        {
            await dbContext.SaveChangesAsync(CancellationToken.None);
            await transaction.CommitAsync(CancellationToken.None);
        }
        catch
        {
            await identityInvitations.DeleteInvitationAsync(providerId, CancellationToken.None);
            throw;
        }
    }

    private async Task LinkExistingInviteeAsync(SpaceInvitation invitation, string authId, DateTime utcNow, CancellationToken cancellationToken)
    {
        var membership = await dbContext.UserSpaces.AnyAsync(
            item => item.SpaceId == invitation.SpaceId && item.User.AuthId == authId, cancellationToken);
        if (!membership)
        {
            await SpaceInvitationRecipient.LinkAsync(dbContext, invitation.Id, invitation.SpaceId, authId, utcNow, cancellationToken);
        }
    }

    private static bool NeedsRecipient(SpaceInvitation invitation) =>
        invitation.InviteeAuthId is null && invitation.ProviderInvitationId is null;

    private static Task<SpaceInvitation?> FindEmailSubmissionAsync(
        IQueryable<SpaceInvitation> submissions, DateTime utcNow, CancellationToken cancellationToken) =>
        submissions.AsNoTracking().Pending(utcNow)
            .Include(item => item.Role).Include(item => item.CreatedBy)
            .SingleOrDefaultAsync(cancellationToken);

    /// <returns>The new invitation, or <see langword="null" /> when the person already has a pending one.</returns>
    private async Task<SpaceInvitation?> InviteIdentityAsync(InvitationContext context, string inviteeAuthId, string label, CancellationToken cancellationToken)
    {
        var invitations = ForIdentity(context.Space.Id, inviteeAuthId).Unclosed();
        await invitations.CloseExpiredAsync(context.UtcNow, cancellationToken);
        if (await invitations.AnyAsync(cancellationToken))
        {
            return null;
        }

        var invitation = SpaceInvitation.ForIdentity(context.Space, context.Role, context.Creator, inviteeAuthId, label, context.UtcNow);
        dbContext.SpaceInvitations.Add(invitation);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return invitation;
        }
        catch (DbUpdateException)
        {
            if (!await invitations.AnyAsync(cancellationToken))
            {
                throw;
            }

            // A parallel request invited the same person first.
            dbContext.SpaceInvitations.Entry(invitation).State = EntityState.Detached;
            return null;
        }
    }

    private IQueryable<SpaceInvitation> ForIdentity(Guid spaceId, string authId) =>
        dbContext.SpaceInvitations.Where(item => item.SpaceId == spaceId && item.InviteeAuthId == authId);

    private sealed record InvitationContext(Space Space, Role Role, User Creator, DateTime UtcNow);
}
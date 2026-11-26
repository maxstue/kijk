using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Security;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;

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
        var context = new InvitationContext(space, role, creator, timeProvider.GetUtcNow().UtcDateTime);

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
        if (previous is not null)
        {
            return previous;
        }

        var authId = await identityInvitations.FindByVerifiedEmailAsync(email, cancellationToken);
        if (authId == currentUser.AuthId)
        {
            return Error.Validation("You cannot invite yourself");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await submissions.CloseExpiredAsync(context.UtcNow, cancellationToken);
        var invitation = SpaceInvitation.ForEmail(context.Space, context.Role, context.Creator, EmailMask.Mask(email), fingerprint, context.UtcNow);
        dbContext.SpaceInvitations.Add(invitation);
        try
        {
            // Reserve the e-mail submission before sending, so concurrent requests cannot both send mail.
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var concurrent = await FindEmailSubmissionAsync(submissions, context.UtcNow, cancellationToken);
            if (concurrent is null)
            {
                throw;
            }

            return concurrent;
        }

        if (authId is null)
        {
            cancellationToken.ThrowIfCancellationRequested();
            // Once sending starts, retain the returned provider id even if the HTTP caller disconnects.
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

            return invitation.ToResponse();
        }

        // A member or someone with another open invitation gets an ordinary admin-visible submission without an Inbox entry.
        var membership = await dbContext.UserSpaces.AnyAsync(
            item => item.SpaceId == context.Space.Id && item.User.AuthId == authId, cancellationToken);
        if (!membership)
        {
            var openForIdentity = ForIdentity(context.Space.Id, authId);
            await openForIdentity.CloseExpiredAsync(context.UtcNow, cancellationToken);
            if (!await openForIdentity.Unclosed().AnyAsync(cancellationToken))
            {
                invitation.LinkInvitee(authId);
                try
                {
                    await dbContext.SaveChangesAsync(cancellationToken);
                }
                catch (DbUpdateException)
                {
                    if (!await openForIdentity.Unclosed().AnyAsync(cancellationToken))
                    {
                        throw;
                    }

                    // A concurrent name or e-mail invitation already reached the recipient.
                    dbContext.SpaceInvitations.Entry(invitation).State = EntityState.Detached;
                }
            }
        }

        await transaction.CommitAsync(cancellationToken);
        return invitation.ToResponse();
    }

    private static Task<SpaceInvitationResponse?> FindEmailSubmissionAsync(
        IQueryable<SpaceInvitation> submissions, DateTime utcNow, CancellationToken cancellationToken) =>
        submissions.AsNoTracking().Pending(utcNow).ToResponse().SingleOrDefaultAsync(cancellationToken);

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
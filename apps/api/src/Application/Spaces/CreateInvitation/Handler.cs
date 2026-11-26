using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
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
        var label = EmailMask.Mask(email);
        var inviteeAuthId = await identityInvitations.FindByVerifiedEmailAsync(email, cancellationToken);
        if (inviteeAuthId == currentUser.AuthId)
        {
            return Error.Validation("You cannot invite yourself");
        }

        if (inviteeAuthId is null)
        {
            return await InviteNewAccountAsync(context, email, label, cancellationToken);
        }

        // Whether the address has an account must not show. Members and people who are already invited therefore get
        // the same response as everyone else: a member does not see the invitation in their inbox, and a second
        // invitation of the same person returns the pending one.
        var invitation = await InviteIdentityAsync(context, inviteeAuthId, label, cancellationToken)
            ?? await dbContext.SpaceInvitations
                .AsNoTracking()
                .Include(item => item.Role)
                .Include(item => item.CreatedBy)
                .Unclosed()
                .SingleAsync(item => item.SpaceId == context.Space.Id && item.InviteeAuthId == inviteeAuthId, cancellationToken);

        return invitation.ToResponse() with { InviteeLabel = label };
    }

    /// <returns>The new invitation, or <see langword="null" /> when the person already has a pending one.</returns>
    private async Task<SpaceInvitation?> InviteIdentityAsync(InvitationContext context, string inviteeAuthId, string label, CancellationToken cancellationToken)
    {
        // An expired invitation still occupies the unique index for this person and space; it can be closed.
        await dbContext.SpaceInvitations
            .Unclosed()
            .Where(item => item.SpaceId == context.Space.Id && item.InviteeAuthId == inviteeAuthId && item.ExpiresAt <= context.UtcNow)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.RevokedAt, context.UtcNow), cancellationToken);

        if (await dbContext.SpaceInvitations.Unclosed().AnyAsync(item => item.SpaceId == context.Space.Id && item.InviteeAuthId == inviteeAuthId, cancellationToken))
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
            if (!await IsInvitedAsync(context.Space.Id, inviteeAuthId, cancellationToken))
            {
                throw;
            }

            // A parallel request invited the same person first.
            dbContext.SpaceInvitations.Entry(invitation).State = EntityState.Detached;
            return null;
        }
    }

    private async Task<Result<SpaceInvitationResponse>> InviteNewAccountAsync(InvitationContext context, string email, string label, CancellationToken cancellationToken)
    {
        var invitation = SpaceInvitation.ForNewAccount(context.Space, context.Role, context.Creator, label, context.UtcNow);
        // Adding assigns the id that the provider invitation carries to the new account.
        dbContext.SpaceInvitations.Add(invitation);
        var providerInvitationId = await identityInvitations.InviteAsync(email, invitation.Id, SpaceInvitation.Lifetime, cancellationToken);
        invitation.AttachProviderInvitation(providerInvitationId);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Without the Kijk invitation, the provider invitation and the address it holds have no purpose.
            await identityInvitations.DeleteInvitationAsync(providerInvitationId, CancellationToken.None);
            throw;
        }

        return invitation.ToResponse();
    }

    private Task<bool> IsInvitedAsync(Guid spaceId, string inviteeAuthId, CancellationToken cancellationToken) =>
        dbContext.SpaceInvitations.AsNoTracking().Unclosed().AnyAsync(item => item.SpaceId == spaceId && item.InviteeAuthId == inviteeAuthId, cancellationToken);

    private sealed record InvitationContext(Space Space, Role Role, User Creator, DateTime UtcNow);
}
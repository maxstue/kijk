using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Users.DeclineInvitation;

/// <summary>
/// Declines an invitation of the current user.
/// </summary>
public sealed class DeclineInvitationHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>
    /// Declines a pending invitation, so it leaves the inbox. The space admins no longer see it as pending.
    /// </summary>
    /// <param name="invitationId">The invitation identifier.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>Whether the invitation was declined, or 404 for an invitation of another person or a closed one.</returns>
    public async Task<Result<bool>> HandleAsync(Guid invitationId, CancellationToken cancellationToken)
    {
        var authId = currentUser.AuthId;
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var invitation = await dbContext.SpaceInvitations
            .FirstOrDefaultAsync(item => item.Id == invitationId && item.InviteeAuthId == authId, cancellationToken);
        if (invitation is null || !invitation.IsPending(utcNow))
        {
            return Error.NotFound("Invitation could not be found");
        }

        invitation.Decline(utcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
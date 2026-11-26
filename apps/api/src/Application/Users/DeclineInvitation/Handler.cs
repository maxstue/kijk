using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
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
        var updated = await dbContext.SpaceInvitations
            .Where(item => item.Id == invitationId && item.InviteeAuthId == authId)
            .Pending(utcNow)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.DeclinedAt, utcNow), cancellationToken);
        if (updated == 0)
        {
            return Error.NotFound("Invitation could not be found");
        }

        return true;
    }
}
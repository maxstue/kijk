using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Spaces.RevokeInvitation;

/// <summary>
/// Revokes a pending invitation of a space.
/// </summary>
public sealed class RevokeInvitationHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>
    /// Revokes an invitation when the current user's role allows inviting, so it disappears from the invited person's inbox.
    /// The cleanup then deletes the e-mail that the authentication provider holds for it.
    /// </summary>
    /// <param name="spaceId">The space identifier.</param>
    /// <param name="invitationId">The invitation identifier.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>Whether the invitation was revoked.</returns>
    public async Task<Result<bool>> HandleAsync(Guid spaceId, Guid invitationId, CancellationToken cancellationToken)
    {
        if (await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, SpacePermissions.Members.Invite, cancellationToken) is { } error)
        {
            return error;
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var updated = await dbContext.SpaceInvitations
            .Where(item => item.Id == invitationId && item.SpaceId == spaceId)
            .Pending(utcNow)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.RevokedAt, utcNow), cancellationToken);
        if (updated == 0)
        {
            return Error.NotFound("Invitation could not be found");
        }

        return true;
    }
}
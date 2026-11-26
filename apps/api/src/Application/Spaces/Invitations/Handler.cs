using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Spaces.Invitations;

/// <summary>
/// Lists the pending invitations of a space.
/// </summary>
public sealed class InvitationsHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>
    /// Lists the invitations that can still be accepted, newest first, when the current user's role allows inviting.
    /// </summary>
    /// <param name="spaceId">The space identifier.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The pending invitations.</returns>
    public async Task<Result<IReadOnlyList<SpaceInvitationResponse>>> HandleAsync(Guid spaceId, CancellationToken cancellationToken)
    {
        if (await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, SpacePermissions.Members.Invite, cancellationToken) is { } error)
        {
            return error;
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var invitations = await dbContext.SpaceInvitations
            .AsNoTracking()
            .Where(item => item.SpaceId == spaceId)
            .Pending(utcNow)
            .OrderByDescending(item => item.CreatedAt)
            .ToResponse()
            .ToListAsync(cancellationToken);

        return invitations;
    }
}
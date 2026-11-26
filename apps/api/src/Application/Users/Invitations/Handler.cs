using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Shared;

namespace Kijk.Application.Users.Invitations;

/// <summary>
/// Lists the pending invitations of the current user.
/// </summary>
public sealed class InvitationsHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>
    /// Lists the invitations the current user can accept, newest first. Invitations to spaces the user already belongs
    /// to are left out.
    /// </summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The pending invitations.</returns>
    public async Task<IReadOnlyList<ReceivedInvitationResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        var authId = currentUser.AuthId;
        var userId = currentUser.Id;
        return await dbContext.SpaceInvitations
            .AsNoTracking()
            .Where(item => item.InviteeAuthId == authId)
            .Pending(timeProvider.GetUtcNow().UtcDateTime)
            .Where(item => !dbContext.UserSpaces.Any(link => link.SpaceId == item.SpaceId && link.UserId == userId))
            .OrderByDescending(item => item.CreatedAt)
            .ToReceivedResponse()
            .ToListAsync(cancellationToken);
    }
}
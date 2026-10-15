using Kijk.Application.Shared.Persistence;
using Kijk.Application.Users.GetMe;
using Kijk.Shared;

namespace Kijk.Application.Users.DefaultSpace;

/// <summary>
/// Request for choosing the space the app opens first.
/// </summary>
/// <param name="SpaceId">The space to open first, or <see langword="null" /> to open the last used space.</param>
public sealed record SetDefaultSpaceRequest(Guid? SpaceId);

/// <summary>
/// Sets or clears the current user's default space. It only decides which space the app opens first; every space
/// request names its space in the route.
/// </summary>
public sealed class SetDefaultSpaceHandler(IAppDbContext dbContext, CurrentUser currentUser, GetMeUserHandler getMeUserHandler)
{
    /// <summary>Makes a membership the default one, or clears the default.</summary>
    /// <param name="request">The new default space.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated account, or a not-found error when the user is not a member.</returns>
    public async Task<Result<CurrentUserResponse>> SetAsync(SetDefaultSpaceRequest request, CancellationToken cancellationToken)
    {
        var memberships = await dbContext.UserSpaces
            .Where(link => link.UserId == currentUser.Id)
            .ToListAsync(cancellationToken);
        if (request.SpaceId is { } spaceId && memberships.TrueForAll(link => link.SpaceId != spaceId))
        {
            return Error.NotFound("Space could not be found");
        }

        foreach (var membership in memberships)
        {
            membership.SetDefault(membership.SpaceId == request.SpaceId);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await getMeUserHandler.GetMeAsync(cancellationToken);
    }
}
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
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        // Serialize default changes for this user, including concurrent browser tabs.
        await dbContext.Users.FromSqlInterpolated($"SELECT * FROM users WHERE id = {currentUser.Id} FOR UPDATE")
            .SingleAsync(cancellationToken);

        var memberships = await dbContext.UserSpaces
            .Where(link => link.UserId == currentUser.Id)
            .ToListAsync(cancellationToken);
        if (request.SpaceId is { } spaceId && memberships.TrueForAll(link => link.SpaceId != spaceId))
        {
            return Error.NotFound("Space could not be found");
        }

        // Clear the old value before setting the new one: the partial unique index is checked per statement.
        foreach (var membership in memberships.Where(link => link.IsDefault))
        {
            membership.SetDefault(false);
        }
        await dbContext.SaveChangesAsync(cancellationToken);

        if (request.SpaceId is { } defaultId)
        {
            memberships.Single(link => link.SpaceId == defaultId).SetDefault(true);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
        return await getMeUserHandler.GetMeAsync(cancellationToken);
    }
}
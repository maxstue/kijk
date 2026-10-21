using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Shared.Authorization;

/// <summary>
/// Resource-based permission checks for a specific space, used when the space comes from the route
/// instead of being the user's active space.
/// </summary>
public static class SpaceAuthorization
{
    /// <summary>
    /// Checks whether the user's role grants a permission in the given space.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    /// <param name="userId">The user identifier.</param>
    /// <param name="spaceId">The space identifier.</param>
    /// <param name="permission">The required permission.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns>
    /// <see langword="null"/> when the permission is granted, a not-found error when the user is not a member
    /// (so space ids are not disclosed), or an authorization error when the role lacks the permission.
    /// </returns>
    public static async Task<Error?> AuthorizeSpaceAsync(
        this IAppDbContext dbContext,
        Guid userId,
        Guid spaceId,
        string permission,
        CancellationToken cancellationToken)
    {
        var hasPermission = await dbContext.UserSpaces
            .Where(link => link.UserId == userId && link.SpaceId == spaceId)
            .Select(link => (bool?)link.Role.Permissions.Any(item => item.Name == permission))
            .SingleOrDefaultAsync(cancellationToken);

        return hasPermission switch
        {
            null => Error.NotFound("Space could not be found"),
            false => Error.Authorization($"Your space role does not allow '{permission}'"),
            true => null
        };
    }

    /// <summary>
    /// Checks the permission needed to change something every member of the active space sees. Private accounts
    /// and budgets only need the endpoint's base permission, because they concern their owner alone.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    /// <param name="currentUser">The current user.</param>
    /// <param name="touchesShared">Whether the change creates, changes or removes something shared.</param>
    /// <param name="permission">The permission required for shared items.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns><see langword="null" /> when allowed, otherwise the authorization error.</returns>
    public static async Task<Error?> AuthorizeSharedChangeAsync(
        this IAppDbContext dbContext,
        CurrentUser currentUser,
        bool touchesShared,
        string permission,
        CancellationToken cancellationToken) =>
        touchesShared && currentUser.ActiveSpaceId is { } spaceId
            ? await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, permission, cancellationToken)
            : null;
}
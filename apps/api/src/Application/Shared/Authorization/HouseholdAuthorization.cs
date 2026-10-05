using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Shared.Authorization;

/// <summary>
/// Resource-based permission checks for a specific household, used when the household comes from the route
/// instead of being the user's active household.
/// </summary>
public static class HouseholdAuthorization
{
    /// <summary>
    /// Checks whether the user's role grants a permission in the given household.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    /// <param name="userId">The user identifier.</param>
    /// <param name="householdId">The household identifier.</param>
    /// <param name="permission">The required permission.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns>
    /// <see langword="null"/> when the permission is granted, a not-found error when the user is not a member
    /// (so household ids are not disclosed), or an authorization error when the role lacks the permission.
    /// </returns>
    public static async Task<Error?> AuthorizeHouseholdAsync(
        this IAppDbContext dbContext,
        Guid userId,
        Guid householdId,
        string permission,
        CancellationToken cancellationToken)
    {
        var hasPermission = await dbContext.UserHouseholds
            .Where(link => link.UserId == userId && link.HouseholdId == householdId)
            .Select(link => (bool?)link.Role.Permissions.Any(item => item.Name == permission))
            .SingleOrDefaultAsync(cancellationToken);

        return hasPermission switch
        {
            null => Error.NotFound("Household could not be found"),
            false => Error.Authorization($"Your household role does not allow '{permission}'"),
            true => null
        };
    }

    /// <summary>
    /// Checks the permission needed to change something every member of the active household sees. Private accounts
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
        touchesShared && currentUser.ActiveHouseholdId is { } householdId
            ? await dbContext.AuthorizeHouseholdAsync(currentUser.Id, householdId, permission, cancellationToken)
            : null;
}
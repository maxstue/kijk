using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Resources.Shared;

/// <summary>
/// Provides the canonical resource visibility and household authorization queries.
/// </summary>
public static class ResourceAccess
{
    /// <summary>
    /// Returns resources available to the current user: enabled system resources and custom resources owned by the
    /// active household.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    /// <param name="currentUser">The current authenticated user.</param>
    /// <returns>A query containing the resources available to the current user.</returns>
    public static IQueryable<Resource> AvailableResources(this IAppDbContext dbContext, CurrentUser currentUser)
    {
        var enabledSystemResourceIds = dbContext.Users
            .Where(user => user.Id == currentUser.Id)
            .SelectMany(user => user.Resources)
            .Where(resource => resource.CreatorType == CreatorType.System)
            .Select(resource => resource.Id);

        return dbContext.Resources.Where(resource =>
            resource.HouseholdId == currentUser.ActiveHouseholdId
            || resource.CreatorType == CreatorType.System && enabledSystemResourceIds.Contains(resource.Id));
    }

    /// <summary>
    /// Determines whether the current user is the administrator of the active household.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    /// <param name="currentUser">The current authenticated user.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns><see langword="true"/> when the user has the Admin role; otherwise <see langword="false"/>.</returns>
    public static Task<bool> IsActiveHouseholdAdminAsync(
        this IAppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken) =>
        dbContext.UserHouseholds
            .AnyAsync(userHousehold =>
                userHousehold.UserId == currentUser.Id
                && userHousehold.HouseholdId == currentUser.ActiveHouseholdId
                && userHousehold.Role.Name == AppConstants.Roles.Admin,
                cancellationToken);

    /// <summary>
    /// Determines whether a resource with the same normalized name and unit exists in the active household or in the
    /// global system resource catalog.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    /// <param name="currentUser">The current authenticated user.</param>
    /// <param name="name">The resource name.</param>
    /// <param name="unit">The resource unit.</param>
    /// <param name="excludedResourceId">An optional resource identifier to exclude from the query.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns><see langword="true"/> when a conflicting resource exists; otherwise <see langword="false"/>.</returns>
    public static Task<bool> HasResourceConflictAsync(
        this IAppDbContext dbContext,
        CurrentUser currentUser,
        string name,
        string unit,
        Guid? excludedResourceId,
        CancellationToken cancellationToken)
    {
        var normalizedName = name.Trim().ToLowerInvariant();
        var normalizedUnit = unit.Trim().ToLowerInvariant();

        var resources = dbContext.Resources.Where(resource =>
            (resource.CreatorType == CreatorType.System
                    || resource.HouseholdId == currentUser.ActiveHouseholdId)
                && resource.Name.Trim().ToLower() == normalizedName
                && resource.Unit.Trim().ToLower() == normalizedUnit);

        if (excludedResourceId.HasValue)
        {
            resources = resources.Where(resource => resource.Id != excludedResourceId.Value);
        }

        return resources.AnyAsync(cancellationToken);
    }
}
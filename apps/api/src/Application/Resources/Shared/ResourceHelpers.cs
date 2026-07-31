using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Resources.Shared;

/// <summary>
/// Provides resource management queries used by the Resources feature.
/// </summary>
internal static class ResourceHelpers
{
    /// <summary>
    /// Returns a resource that may be modified.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    /// <param name="currentUser">The current authenticated user.</param>
    /// <param name="resourceId">The resource identifier.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns>The modifiable resource or an authorization/not-found error.</returns>
    internal static async Task<Result<Resource>> GetModifiableResourceAsync(IAppDbContext dbContext, CurrentUser currentUser, Guid resourceId, CancellationToken cancellationToken)
    {
        var resource = await dbContext
            .GetUserAvailableResources(currentUser)
            .FirstOrDefaultAsync(resource => resource.Id == resourceId, cancellationToken);
        if (resource is null)
        {
            return Error.NotFound("Resource could not be found");
        }

        return resource.CreatorType == CreatorType.System
            ? Error.Authorization("System resources cannot be modified")
            : resource;
    }

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
    internal static Task<bool> HasConflictAsync(IAppDbContext dbContext, CurrentUser currentUser, string name, string unit, Guid? excludedResourceId, CancellationToken cancellationToken)
    {
        var normalizedName = name.Trim().ToLowerInvariant();
        var normalizedUnit = unit.Trim().ToLowerInvariant();

        var resources = dbContext.Resources.Where(resource =>
            (resource.CreatorType == CreatorType.System || resource.HouseholdId == currentUser.ActiveHouseholdId)
            && resource.Name.Trim().ToLower() == normalizedName
            && resource.Unit.Trim().ToLower() == normalizedUnit);

        if (excludedResourceId.HasValue)
        {
            resources = resources.Where(resource => resource.Id != excludedResourceId.Value);
        }

        return resources.AnyAsync(cancellationToken);
    }
}
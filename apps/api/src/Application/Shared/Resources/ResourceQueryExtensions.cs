using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Shared.Resources;

/// <summary>
/// Provides resource queries shared across application features.
/// </summary>
public static class ResourceQueryExtensions
{
    /// <param name="dbContext">The application database context.</param>
    extension(IAppDbContext dbContext)
    {
        /// <summary>
        /// Returns resources available to the current user: enabled system resources and custom resources owned by the
        /// active household.
        /// </summary>
        /// <param name="currentUser">The current authenticated user.</param>
        /// <returns>A query containing the resources available to the current user.</returns>
        public IQueryable<Resource> GetUserAvailableResources(CurrentUser currentUser)
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
    }
}
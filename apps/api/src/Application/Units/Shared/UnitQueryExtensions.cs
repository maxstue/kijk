using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.Shared;

/// <summary>
/// Provides reusable unit access queries.
/// </summary>
public static class UnitQueryExtensions
{
    extension(IAppDbContext dbContext)
    {
        /// <summary>
        /// Returns units visible to the current user.
        /// </summary>
        public IQueryable<Unit> GetVisibleUnits(CurrentUser currentUser) =>
            dbContext.Units.Where(unit =>
                unit.CreatorType == CreatorType.System
                || unit.OwnerUserId == currentUser.Id
                || unit.Households.Any(link => link.HouseholdId == currentUser.ActiveHouseholdId));

        /// <summary>
        /// Returns units selectable in the active household.
        /// </summary>
        public IQueryable<Unit> GetAvailableUnits(CurrentUser currentUser) =>
            dbContext.Units.Where(unit =>
                unit.ArchivedAt == null
                && unit.ConversionType != UnitConversionType.None
                && (unit.CreatorType == CreatorType.System
                    || unit.Households.Any(link => link.HouseholdId == currentUser.ActiveHouseholdId)));
    }
}
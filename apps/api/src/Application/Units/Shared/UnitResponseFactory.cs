using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.Shared;

/// <summary>
/// Creates unit API responses.
/// </summary>
public static class UnitResponseFactory
{
    public static UnitResponse Create(Unit unit, CurrentUser currentUser, int resourceCount, Guid? householdId = null) => new(
        unit.Id,
        unit.Name,
        unit.Symbol,
        unit.CreatorType,
        unit.ConversionType,
        unit.QuantityKey,
        unit.UnitsNetUnitName,
        unit.ReferenceUnitId,
        unit.ConversionFactor,
        unit.OwnerUserId,
        unit.OwnerUserId == currentUser.Id,
        unit.CreatorType == CreatorType.System || unit.Households.Any(link => link.HouseholdId == (householdId ?? currentUser.ActiveHouseholdId)),
        unit.ArchivedAt.HasValue,
        resourceCount,
        unit.Households.Select(link => link.HouseholdId).ToList());
}
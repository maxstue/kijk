using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.Shared;

/// <summary>
/// Creates unit API responses.
/// </summary>
public static class UnitResponseFactory
{
    /// <summary>Creates the response for a unit as seen by the current user.</summary>
    /// <param name="unit">The unit with its space shares loaded.</param>
    /// <param name="currentUser">The current user.</param>
    /// <param name="resourceCount">The number of resources using the unit.</param>
    /// <param name="spaceId">The space context; defaults to the active space.</param>
    /// <returns>The response.</returns>
    public static UnitResponse Create(Unit unit, CurrentUser currentUser, int resourceCount, Guid? spaceId = null) => new(
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
        unit.CreatorType == CreatorType.System || unit.Spaces.Any(link => link.SpaceId == (spaceId ?? currentUser.ActiveSpaceId)),
        unit.ArchivedAt.HasValue,
        resourceCount,
        unit.Spaces.Select(link => link.SpaceId).ToList());
}
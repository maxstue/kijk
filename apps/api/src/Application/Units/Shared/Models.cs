using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.Shared;

/// <summary>
/// A unit available to the current user.
/// </summary>
public sealed record UnitResponse(
    Guid Id,
    string Name,
    string Symbol,
    CreatorType CreatorType,
    UnitConversionType ConversionType,
    string QuantityKey,
    string? UnitsNetUnitName,
    Guid? ReferenceUnitId,
    decimal? ConversionFactor,
    Guid? OwnerUserId,
    bool IsOwner,
    bool IsAvailableInActiveSpace,
    bool IsArchived,
    int ResourceCount,
    IReadOnlyList<Guid> SpaceIds);

/// <summary>
/// Unit information embedded in resource responses.
/// </summary>
public sealed record ResourceUnitResponse(Guid Id, string Name, string Symbol, string QuantityKey);
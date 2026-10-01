using Kijk.Shared;

namespace Kijk.Application.Resources.Shared;

/// <summary>A resource that consumptions can be recorded for.</summary>
/// <param name="Id">The resource id.</param>
/// <param name="Name">The resource name.</param>
/// <param name="Color">The display color.</param>
/// <param name="Icon">The icon name.</param>
/// <param name="UnitId">The unit id.</param>
/// <param name="Unit">The unit symbol.</param>
/// <param name="UnitName">The unit name.</param>
/// <param name="QuantityKey">The physical quantity of the unit.</param>
/// <param name="CreatorType">Whether it is a system or a custom resource.</param>
public record ResourceResponse(
    Guid Id,
    string Name,
    string Color,
    string Icon,
    Guid UnitId,
    string Unit,
    string UnitName,
    string QuantityKey,
    CreatorType CreatorType);
using Kijk.Shared;

namespace Kijk.Application.Resources.Shared;

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
using Kijk.Shared;

namespace Kijk.Application.ConsumptionLimits.Create;

/// <summary>
/// Request for creating a consumption limit.
/// </summary>
public sealed record CreateConsumptionLimitRequest(
    string Name,
    string? Description,
    decimal Limit,
    Period Period,
    bool Active,
    Guid ResourceId);
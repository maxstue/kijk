using Kijk.Shared;

namespace Kijk.Application.ConsumptionLimits.Update;

/// <summary>
/// Request for replacing the editable properties of a consumption limit.
/// </summary>
public sealed record UpdateConsumptionLimitRequest(
    string Name,
    string? Description,
    decimal Limit,
    Period Period,
    bool Active);
using Kijk.Shared;

namespace Kijk.Application.Limits.Shared;

/// <summary>
/// A consumption limit together with its current evaluation data.
/// </summary>
public sealed record LimitResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Limit,
    Period Period,
    bool Active,
    LimitResourceResponse Resource,
    decimal ActualValue,
    decimal RemainingValue,
    decimal UtilizationPercentage,
    bool IsExceeded,
    DateTime PeriodStart,
    DateTime PeriodEnd,
    DateTime? LastOccurrence);

/// <summary>
/// The resource governed by a consumption limit.
/// </summary>
public sealed record LimitResourceResponse(Guid Id, string Name, string Unit, string Color);
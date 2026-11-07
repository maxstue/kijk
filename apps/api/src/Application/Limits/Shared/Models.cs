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
    DateTime? LastOccurrence,
    IReadOnlyList<LimitPeriodResponse> History);

/// <summary>
/// A recorded calendar period evaluated against the limit's current threshold and period settings.
/// Periods without readings and future periods are omitted; the current period is provisional.
/// </summary>
/// <param name="PeriodStart">The inclusive UTC calendar period start.</param>
/// <param name="PeriodEnd">The exclusive UTC calendar period end.</param>
/// <param name="ActualValue">The total normalized consumption recorded in the period.</param>
/// <param name="IsExceeded">Whether the consumption reached or exceeded the current threshold.</param>
/// <param name="IsComplete">Whether the calendar period has ended.</param>
public sealed record LimitPeriodResponse(
    DateTime PeriodStart,
    DateTime PeriodEnd,
    decimal ActualValue,
    bool IsExceeded,
    bool IsComplete);

/// <summary>
/// The resource governed by a consumption limit.
/// </summary>
public sealed record LimitResourceResponse(Guid Id, string Name, string Unit, string Color);
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.ConsumptionLimits.Shared;

/// <summary>
/// Evaluates consumption limits for the current calendar period.
/// </summary>
internal static class ConsumptionLimitEvaluation
{
    internal static (DateTime Start, DateTime End) GetPeriodRange(Period period, DateTime utcNow)
    {
        var start = period switch
        {
            Period.Month => new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc),
            Period.Quarter => new DateTime(utcNow.Year, (utcNow.Month - 1) / 3 * 3 + 1, 1, 0, 0, 0, DateTimeKind.Utc),
            Period.Year => new DateTime(utcNow.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            _ => throw new ArgumentOutOfRangeException(nameof(period), period, "Unsupported consumption limit period")
        };

        var end = period switch
        {
            Period.Month => start.AddMonths(1),
            Period.Quarter => start.AddMonths(3),
            Period.Year => start.AddYears(1),
            _ => throw new ArgumentOutOfRangeException(nameof(period), period, "Unsupported consumption limit period")
        };

        return (start, end);
    }

    internal static ConsumptionLimitResponse ToResponse(ConsumptionLimit limit, IEnumerable<Consumption> consumptions, DateTime utcNow)
    {
        var (start, end) = GetPeriodRange(limit.Period, utcNow);
        var actualValue = consumptions
            .Where(consumption => consumption.ResourceId == limit.ResourceId
                                  && consumption.Date.Value >= start
                                  && consumption.Date.Value < end)
            .Sum(consumption => consumption.Value);
        var remainingValue = Math.Max(0, limit.Limit - actualValue);
        var utilizationPercentage = limit.Limit == 0 ? 0 : decimal.Round(actualValue / limit.Limit * 100, 2);

        return new ConsumptionLimitResponse(
            limit.Id,
            limit.Name,
            limit.Description,
            limit.Limit,
            limit.Period,
            limit.Active,
            new ConsumptionLimitResourceResponse(limit.Resource.Id, limit.Resource.Name, limit.Resource.Unit, limit.Resource.Color),
            actualValue,
            remainingValue,
            utilizationPercentage,
            actualValue >= limit.Limit,
            start,
            end);
    }
}
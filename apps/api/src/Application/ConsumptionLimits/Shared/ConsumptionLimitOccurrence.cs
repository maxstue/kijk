using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;

namespace Kijk.Application.ConsumptionLimits.Shared;

/// <summary>
/// Records threshold crossings in the same save as the triggering consumption change.
/// </summary>
internal static class ConsumptionLimitOccurrence
{
    internal static IReadOnlyList<ConsumptionSnapshot> Capture(IEnumerable<Consumption> consumptions) =>
        consumptions
            .Select(item => new ConsumptionSnapshot(item.ResourceId, item.Date, item.CalculatedConsumption))
            .ToList();

    internal static async Task RecordAsync(
        IAppDbContext dbContext,
        Guid householdId,
        IReadOnlyCollection<ConsumptionSnapshot> before,
        IReadOnlyCollection<Consumption> after,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var resourceIds = before.Select(item => item.ResourceId)
            .Concat(after.Select(item => item.ResourceId))
            .Distinct()
            .ToList();

        var limits = await dbContext.ConsumptionsLimits
            .Where(limit => limit.HouseholdId == householdId
                            && resourceIds.Contains(limit.ResourceId)
                            && limit.Active)
            .ToListAsync(cancellationToken);

        foreach (var limit in limits)
        {
            var ranges = before
                .Where(item => item.ResourceId == limit.ResourceId)
                .Select(item => ConsumptionLimitEvaluation.GetPeriodRange(limit.Period, item.Date))
                .Concat(after
                    .Where(item => item.ResourceId == limit.ResourceId)
                    .Select(item => ConsumptionLimitEvaluation.GetPeriodRange(limit.Period, item.Date)))
                .Distinct();

            foreach (var (start, end) in ranges)
            {
                var beforeValue = before
                    .Where(item => item.ResourceId == limit.ResourceId && item.Date >= start && item.Date < end)
                    .Sum(item => item.CalculatedConsumption);
                var afterValue = after
                    .Where(item => item.ResourceId == limit.ResourceId && item.Date >= start && item.Date < end)
                    .Sum(item => item.CalculatedConsumption);

                limit.RecordOccurrence(beforeValue >= limit.Limit, afterValue >= limit.Limit, utcNow);
            }
        }
    }

    internal sealed record ConsumptionSnapshot(Guid ResourceId, DateTime Date, decimal CalculatedConsumption);
}
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;

namespace Kijk.Application.ConsumptionLimits.Shared;

/// <summary>
/// Records threshold crossings in the same save as the triggering consumption change.
/// </summary>
internal static class ConsumptionLimitOccurrence
{
    internal static async Task RecordAsync(
        IAppDbContext dbContext,
        Consumption consumption,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var limits = await dbContext.ConsumptionsLimits
            .Where(limit => limit.HouseholdId == consumption.HouseholdId
                            && limit.ResourceId == consumption.ResourceId
                            && limit.Active)
            .ToListAsync(cancellationToken);

        foreach (var limit in limits)
        {
            var (start, end) = ConsumptionLimitEvaluation.GetPeriodRange(limit.Period, consumption.Date.Value);
            var entries = await dbContext.Consumptions
                .Where(item => item.HouseholdId == consumption.HouseholdId
                               && item.ResourceId == consumption.ResourceId
                               && item.Date.Value >= start && item.Date.Value < end)
                .AsNoTracking()
                .Select(item => new { item.Id, item.Value })
                .ToListAsync(cancellationToken);

            var before = entries.Sum(item => item.Value);
            var after = entries.Where(item => item.Id != consumption.Id).Sum(item => item.Value) + consumption.Value;
            limit.RecordOccurrence(before >= limit.Limit, after >= limit.Limit, utcNow);
        }
    }
}
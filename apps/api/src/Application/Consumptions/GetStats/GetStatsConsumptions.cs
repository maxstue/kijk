using System.Globalization;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Consumptions.GetStats;

/// <summary>Calculates resource statistics from monthly totals for the selected and comparison periods.</summary>
public class GetStatsConsumptionsHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>Calculates the statistics of every resource for the selected year and month.</summary>
    /// <param name="year">The selected year.</param>
    /// <param name="month">The selected month as English month name.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The statistics, or a validation error for an invalid month.</returns>
    public async Task<Result<GetStatsConsumptionsResponseWrapper>> GetStatsAsync(int year, string month, CancellationToken cancellationToken)
    {
        if (!DateTime.TryParseExact(month, "MMMM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedMonth))
        {
            return Error.Validation($"Month '{month}' is invalid");
        }

        var now = timeProvider.GetUtcNow();
        var isCurrentYear = year == now.Year;
        var isCurrentMonth = isCurrentYear && parsedMonth.Month == now.Month;
        var comparisonYear = year < now.Year ? now.Year : year;
        if (isCurrentYear)
        {
            comparisonYear = now.Year - 1;
        }
        var comparisonMonth = isCurrentMonth ? now.AddMonths(-1) : now;
        var selectedStart = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var selectedEnd = selectedStart.AddYears(1);
        var comparisonStart = new DateTime(comparisonYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var comparisonEnd = comparisonStart.AddYears(1);
        var comparisonMonthStart = new DateTime(comparisonMonth.Year, comparisonMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var comparisonMonthEnd = comparisonMonthStart.AddMonths(1);

        // Aggregate in PostgreSQL once; overlapping periods do not duplicate consumptions.
        var monthlyTotals = await dbContext.Consumptions
            .Where(consumption => consumption.SpaceId == currentUser.ActiveSpaceId)
            .Where(consumption =>
                (consumption.Date >= selectedStart && consumption.Date < selectedEnd)
                || (consumption.Date >= comparisonStart && consumption.Date < comparisonEnd)
                || (consumption.Date >= comparisonMonthStart && consumption.Date < comparisonMonthEnd))
            .GroupBy(consumption => new
            {
                consumption.ResourceId,
                consumption.Resource.Name,
                consumption.Resource.Unit.Symbol,
                consumption.Resource.Color,
                consumption.Resource.Icon,
                consumption.Date.Year,
                consumption.Date.Month
            })
            .Select(group => new MonthlyTotal(
                new ConsumptionStatsResourceResponse(group.Key.ResourceId, group.Key.Name, group.Key.Symbol, group.Key.Color, group.Key.Icon),
                group.Key.Year,
                group.Key.Month,
                group.Sum(consumption => consumption.CalculatedConsumption)))
            .ToListAsync(cancellationToken);

        var stats = monthlyTotals.GroupBy(total => total.Resource).Select(resourceTotals =>
        {
            var byYear = resourceTotals.ToLookup(total => total.Year);
            var selectedTotals = byYear[year].ToDictionary(total => total.Month, total => total.Value);
            var yearTotal = selectedTotals.Values.Sum();
            var monthTotal = selectedTotals.GetValueOrDefault(parsedMonth.Month);
            var comparisonYearTotal = byYear[comparisonYear].Sum(total => total.Value);
            var comparisonMonthTotal = byYear[comparisonMonth.Year]
                .Where(total => total.Month == comparisonMonth.Month)
                .Sum(total => total.Value);

            return new ConsumptionStatsResponse(
                resourceTotals.Key,
                monthTotal,
                yearTotal,
                selectedTotals.Count == 0 ? 0 : selectedTotals.Values.Average(),
                selectedTotals.Values.DefaultIfEmpty(0).Min(),
                selectedTotals.Values.DefaultIfEmpty(0).Max(),
                comparisonYearTotal,
                isCurrentYear ? yearTotal - comparisonYearTotal : comparisonYearTotal - yearTotal,
                comparisonMonthTotal,
                isCurrentMonth ? monthTotal - comparisonMonthTotal : comparisonMonthTotal - monthTotal);
        }).ToList();

        return new GetStatsConsumptionsResponseWrapper(stats);
    }

    private sealed record MonthlyTotal(ConsumptionStatsResourceResponse Resource, int Year, int Month, decimal Value);
}

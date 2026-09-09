using System.Globalization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Consumptions.GetStats;

/// <summary>
/// Handler for getting consumption statistics.
/// It returns the resource usage statistics for the selected year and month.
/// The statistics include the total, average, min, and max values for the selected year.
/// The comparison year is the previous year if the selected year is the current year.
/// The comparison year is the current year if the selected year is in the past.
/// The comparison month is the current month unless the selected month is the current month.
/// </summary>
public class GetStatsConsumptionsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    public async Task<Result<GetStatsConsumptionsResponseWrapper>> GetStatsAsync(int year, string month, CancellationToken cancellationToken)
    {
        if (!DateTime.TryParseExact(month, "MMMM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedMonth))
        {
            return Error.Validation($"Month '{month}' is invalid");
        }

        var selectedYearUsages = await dbContext.Consumptions
            .Include(x => x.Resource)
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Year == year)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var selectedMonth = parsedMonth.Month;
        var comparisonYear = GetComparisonYear(year);
        var comparisonYearUsages = await dbContext.Consumptions
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Year == comparisonYear)
            .Include(x => x.Resource)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var comparisonMonth = GetComparisonMonthPeriod(year, selectedMonth);
        var comparisonMonthUsages = await dbContext.Consumptions
            .Include(x => x.Resource)
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Year == comparisonMonth.Year)
            .Where(x => x.Date.Month == comparisonMonth.Month)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var resources = selectedYearUsages
            .Concat(comparisonYearUsages)
            .Concat(comparisonMonthUsages)
            .Select(x => x.Resource)
            .DistinctBy(x => x.Id)
            .ToList();

        var result = resources
            .Select(resource => CalculateStats(new(
                resource,
                new(year, selectedMonth),
                new(selectedYearUsages, comparisonYearUsages, comparisonMonthUsages))))
            .ToList();

        return new GetStatsConsumptionsResponseWrapper(result);
    }

    /// <summary>
    /// Get the comparison year based on the selected year
    /// If the selected year is the current year, the comparison year is the previous year
    /// If the selected year is in the past, the comparison year is the current year
    /// </summary>
    /// <param name="selectedYear"></param>
    /// <returns></returns>
    private static int GetComparisonYear(int selectedYear)
    {
        var currentYear = DateTime.UtcNow.Year;
        // compare to previous year if selected year is current year
        if (selectedYear == currentYear)
        {
            return currentYear - 1;
        }

        // compare to current year if selected year is in the past
        if (selectedYear < currentYear)
        {
            return currentYear;
        }

        // compare to current year if selected year is in the future
        return selectedYear;
    }

    private static (int Year, int Month) GetComparisonMonthPeriod(int selectedYear, int selectedMonth)
    {
        var currentYear = DateTime.UtcNow.Year;
        var currentMonth = DateTime.UtcNow.Month;

        if (selectedYear == currentYear && selectedMonth == currentMonth)
        {
            return currentMonth == 1 ? (currentYear - 1, 12) : (currentYear, currentMonth - 1);
        }

        return (currentYear, currentMonth);
    }

    private static ConsumptionStatsResponse CalculateStats(StatsCalculationParameters parameters)
    {
        var selectedYearConsumptions = parameters.Usages.SelectedYear
            .Where(x => x.ResourceId == parameters.Resource.Id)
            .ToList();
        var comparisonYearConsumptions = parameters.Usages.ComparisonYear
            .Where(x => x.ResourceId == parameters.Resource.Id)
            .ToList();
        var comparisonMonthConsumptions = parameters.Usages.ComparisonMonth
            .Where(x => x.ResourceId == parameters.Resource.Id)
            .ToList();

        var selectedMonthlyTotals = selectedYearConsumptions
            .GroupBy(x => x.Date.Month)
            .Select(group => group.Sum(x => x.CalculatedConsumption))
            .ToList();

        var yearTotal = selectedMonthlyTotals.Sum();
        var yearAverage = selectedMonthlyTotals.Count == 0 ? 0 : selectedMonthlyTotals.Average();
        var yearMin = selectedMonthlyTotals.DefaultIfEmpty(0).Min();
        var yearMax = selectedMonthlyTotals.DefaultIfEmpty(0).Max();

        var compYearTotal = comparisonYearConsumptions.Sum(x => x.CalculatedConsumption);
        var compYearDiff = CalculateYearDiff(parameters.Period.SelectedYear, yearTotal, compYearTotal);

        var compMonthTotal = comparisonMonthConsumptions.Sum(x => x.CalculatedConsumption);
        var selectedMonthTotal = selectedYearConsumptions
            .Where(x => x.Date.Month == parameters.Period.SelectedMonth)
            .Sum(x => x.CalculatedConsumption);
        var compMonthDiff = CalculateMonthDiff(
            parameters.Period.SelectedYear,
            parameters.Period.SelectedMonth,
            selectedMonthTotal,
            compMonthTotal);

        return new ConsumptionStatsResponse(
            new ConsumptionStatsResourceResponse(
                parameters.Resource.Id,
                parameters.Resource.Name,
                parameters.Resource.Unit,
                parameters.Resource.Color),
            selectedMonthTotal,
            yearTotal,
            yearAverage,
            yearMin,
            yearMax,
            compYearTotal,
            compYearDiff,
            compMonthTotal,
            compMonthDiff);
    }

    private sealed record StatsCalculationParameters(
        Resource Resource,
        StatsPeriodParameters Period,
        StatsUsageParameters Usages);

    private sealed record StatsPeriodParameters(int SelectedYear, int SelectedMonth);

    private sealed record StatsUsageParameters(
        IList<Domain.Entities.Consumption> SelectedYear,
        IList<Domain.Entities.Consumption> ComparisonYear,
        IList<Domain.Entities.Consumption> ComparisonMonth);

    private static decimal CalculateYearDiff(int selectedYear, decimal selectedYearTotal, decimal compYearTotal)
    {
        var currentYear = DateTime.UtcNow.Year;

        return selectedYear == currentYear
            ? selectedYearTotal - compYearTotal
            : compYearTotal - selectedYearTotal;
    }

    private static decimal CalculateMonthDiff(int selectedYear, int selectedMonth, decimal selectedMonthTotal, decimal compMonthTotal)
    {
        var currentYear = DateTime.UtcNow.Year;
        var currentMonth = DateTime.UtcNow.Month;

        return selectedYear == currentYear && selectedMonth == currentMonth
            ? selectedMonthTotal - compMonthTotal
            : compMonthTotal - selectedMonthTotal;
    }
}
using System.Globalization;
using Kijk.Application.Shared.Persistence;
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
            .Where(x => x.Date.Value.Year == year)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var selectedMonth = parsedMonth.Month;
        var comparisonYear = GetComparisonYear(year);
        var comparisonYearUsages = await dbContext.Consumptions
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Value.Year == comparisonYear)
            .Include(x => x.Resource)
            .AsNoTracking()
            .GroupBy(x => new { TypeName = x.Resource.Name, TypeUnit = x.Resource.Unit, TypeColor = x.Resource.Color })
            .Select(g => new { g.Key.TypeName, g.Key.TypeUnit, g.Key.TypeColor, Usages = g.ToList() })
            .ToListAsync(cancellationToken);

        var comparisonMonth = GetComparisonMonthPeriod(year, selectedMonth);
        var comparisonMonthUsages = await dbContext.Consumptions
            .Include(x => x.Resource)
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Value.Year == comparisonMonth.Year)
            .Where(x => x.Date.Value.Month == comparisonMonth.Month)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var resources = selectedYearUsages
            .Select(x => new { TypeName = x.Resource.Name, TypeUnit = x.Resource.Unit, TypeColor = x.Resource.Color })
            .Concat(comparisonYearUsages.Select(x => new { x.TypeName, x.TypeUnit, x.TypeColor }))
            .Concat(comparisonMonthUsages.Select(x => new { TypeName = x.Resource.Name, TypeUnit = x.Resource.Unit, TypeColor = x.Resource.Color }))
            .DistinctBy(x => new { x.TypeName, x.TypeUnit })
            .ToList();

        var result = resources
            .Select(resource =>
            {
                var comparisonUsages = comparisonYearUsages.Find(x => x.TypeName == resource.TypeName && x.TypeUnit == resource.TypeUnit)
                    ?.Usages ?? [];

                return CalculateStats(new(
                    new(resource.TypeName, resource.TypeUnit, resource.TypeColor),
                    new(year, month),
                    new(selectedYearUsages, comparisonUsages, comparisonMonthUsages)));
            })
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
        var selectedMonthInt = DateTime.ParseExact(parameters.Period.SelectedMonth, "MMMM", CultureInfo.InvariantCulture).Month;

        var selectedYearEnergiesByType = parameters.Usages.SelectedYear
            .Where(x => x.Resource.Name == parameters.Resource.Type && x.Resource.Unit == parameters.Resource.Unit)
            .ToList();
        var comparisonYearEnergiesByType = parameters.Usages.ComparisonYear
            .Where(x => x.Resource.Name == parameters.Resource.Type && x.Resource.Unit == parameters.Resource.Unit)
            .ToList();
        var comparisonMonthEnergiesByType = parameters.Usages.ComparisonMonth
            .Where(x => x.Resource.Name == parameters.Resource.Type && x.Resource.Unit == parameters.Resource.Unit)
            .ToList();

        var selectedMonthEnergies = selectedYearEnergiesByType.Where(x => x.Date.Value.Month == selectedMonthInt).ToList();

        var yearTotal = selectedYearEnergiesByType.Sum(x => x.Value);
        var yearAverage = selectedYearEnergiesByType.Count == 0 ? yearTotal : yearTotal / selectedYearEnergiesByType.Count;
        var yearMin = selectedYearEnergiesByType.Select(x => x.Value).DefaultIfEmpty(0).Min();
        var yearMax = selectedYearEnergiesByType.Select(x => x.Value).DefaultIfEmpty(0).Max();

        var compYearTotal = comparisonYearEnergiesByType.Sum(x => x.Value);
        var compYearDiff = CalculateYearDiff(parameters.Period.SelectedYear, yearTotal, compYearTotal);

        var compMonthTotal = comparisonMonthEnergiesByType.Sum(x => x.Value);
        var selectedMonthTotal = selectedMonthEnergies.Sum(x => x.Value);
        var compMonthDiff = CalculateMonthDiff(parameters.Period.SelectedYear, selectedMonthInt, selectedMonthTotal, compMonthTotal);

        return new ConsumptionStatsResponse(new ConsumptionStatsResourceResponse(parameters.Resource.Type, parameters.Resource.Unit, parameters.Resource.Color), selectedMonthTotal, yearTotal, yearAverage,
            yearMin, yearMax, compYearTotal, compYearDiff, compMonthTotal, compMonthDiff);
    }

    private sealed record StatsCalculationParameters(
        StatsResourceParameters Resource,
        StatsPeriodParameters Period,
        StatsUsageParameters Usages);

    private sealed record StatsResourceParameters(string Type, string Unit, string Color);

    private sealed record StatsPeriodParameters(int SelectedYear, string SelectedMonth);

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
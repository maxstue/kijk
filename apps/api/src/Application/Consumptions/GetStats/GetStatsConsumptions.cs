using System.Globalization;
using Kijk.Application.Abstractions.Persistence;
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

                return CalculateStats(resource.TypeName, resource.TypeUnit, resource.TypeColor, year, month, selectedYearUsages,
                    comparisonUsages, comparisonMonthUsages);
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

    private static ConsumptionStatsResponse CalculateStats(string type, string unit, string color, int selectedYear, string selectedMonth,
        IList<Domain.Entities.Consumption> selectedYearEnergies, IList<Domain.Entities.Consumption> comparisonYearEnergies,
        IList<Domain.Entities.Consumption> comparisonMonthEnergies)
    {
        var selectedMonthInt = DateTime.ParseExact(selectedMonth, "MMMM", CultureInfo.InvariantCulture).Month;

        var selectedYearEnergiesByType = selectedYearEnergies.Where(x => x.Resource.Name == type && x.Resource.Unit == unit).ToList();
        var comparisonYearEnergiesByType = comparisonYearEnergies.Where(x => x.Resource.Name == type && x.Resource.Unit == unit).ToList();
        var comparisonMonthEnergiesByType = comparisonMonthEnergies.Where(x => x.Resource.Name == type && x.Resource.Unit == unit).ToList();

        var selectedMonthEnergies = selectedYearEnergiesByType.Where(x => x.Date.Value.Month == selectedMonthInt).ToList();

        var yearTotal = selectedYearEnergiesByType.Sum(x => x.Value);
        var yearAverage = selectedYearEnergiesByType.Count == 0 ? yearTotal : yearTotal / selectedYearEnergiesByType.Count;
        var yearMin = selectedYearEnergiesByType.Select(x => x.Value).DefaultIfEmpty(0).Min();
        var yearMax = selectedYearEnergiesByType.Select(x => x.Value).DefaultIfEmpty(0).Max();

        var compYearTotal = comparisonYearEnergiesByType.Sum(x => x.Value);
        var compYearDiff = CalculateYearDiff(selectedYear, yearTotal, compYearTotal);

        var compMonthTotal = comparisonMonthEnergiesByType.Sum(x => x.Value);
        var selectedMonthTotal = selectedMonthEnergies.Sum(x => x.Value);
        var compMonthDiff = CalculateMonthDiff(selectedYear, selectedMonthInt, selectedMonthTotal, compMonthTotal);

        return new ConsumptionStatsResponse(new ConsumptionStatsResourceResponse(type, unit, color), selectedMonthTotal, yearTotal, yearAverage,
            yearMin, yearMax, compYearTotal, compYearDiff, compMonthTotal, compMonthDiff);
    }

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
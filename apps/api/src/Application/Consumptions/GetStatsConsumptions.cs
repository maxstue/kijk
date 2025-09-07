using System.Globalization;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Application.Consumptions;

public record GetStatsConsumptionsResponseWrapper(IList<ConsumptionStatsResponse> Stats);

public record ConsumptionStatsResponse(
    ConsumptionStatsResourceResponse Resource,
    decimal MonthTotal,
    decimal YearTotal,
    decimal YearAverage,
    decimal YearMin,
    decimal YearMax,
    decimal ComparisonYear,
    decimal ComparisonYearDiff,
    decimal ComparisonMonth,
    decimal ComparisonMonthDiff);

public record ConsumptionStatsResourceResponse(string Name, string Unit, string Color);

/// <summary>
/// Handler for getting consumption statistics.
/// It returns the resource usage statistics for the selected year and month.
/// The statistics include the total, average, min, and max values for the selected year.
/// If the selected year or month is the current year or month, the comparison year or month is the previous year or month.
/// If the selected year or month is in the past, the comparison year or month is the current year or month.
/// The statistics for the comparison year and month are calculated based on the selected year and month.
/// The comparison year is the previous year if the selected year is the current year.
/// The comparison year is the current year if the selected year is in the past.
/// The comparison month is the previous month if the selected month is the current month.
/// The comparison month is the current month if the selected month is in the past.
/// </summary>
public class GetStatsConsumptionsHandler(AppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    public async Task<Result<GetStatsConsumptionsResponseWrapper>> GetStatsAsync(int year, string month, CancellationToken cancellationToken)
    {
        var selectedYearUsages = await dbContext.Consumptions
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Value.Year == year)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var comparisonYear = GetComparisonYear(year);
        var comparisonYearUsages = await dbContext.Consumptions
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Value.Year == comparisonYear)
            .Include(x => x.Resource)
            .AsNoTracking()
            .GroupBy(x => new { TypeName = x.Resource.Name, TypeUnit = x.Resource.Unit, TypeColor = x.Resource.Color })
            .Select(g => new { g.Key.TypeName, g.Key.TypeUnit, g.Key.TypeColor, Usages = g.ToList() })
            .ToListAsync(cancellationToken);

        var result = comparisonYearUsages
            .Select(c => CalculateStats(c.TypeName, c.TypeUnit, c.TypeColor, year, month, selectedYearUsages,
                c.Usages))
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
        var currentYear = DateTime.Now.Year;
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

    /// <summary>
    /// Get the comparison month based on the selected year and month.
    /// If the selected year is the current year, the comparison month is the previous month.
    /// If the selected year is in the past, the comparison month is the current month.
    /// </summary>
    /// <param name="selectedYear"></param>
    /// <param name="selectedMonth"></param>
    /// <returns></returns>
    private static int GetComparisonMonth(int selectedYear, int selectedMonth)
    {
        var currentYear = DateTime.Now.Year;
        var currentMonth = DateTime.Now.Month;
        // compare to current month if selected year is current year
        if (selectedYear == currentYear)
        {
            // compare to previous month if selected month is current month
            if (selectedMonth == currentMonth)
            {
                return currentMonth - 1;
            }

            // compare to current month if selected month is in the past
            if (selectedMonth < currentMonth)
            {
                return currentMonth;
            }
        }

        // compare to current month if selected year is in the future
        return currentMonth;
    }

    private static ConsumptionStatsResponse CalculateStats(string type, string unit, string color, int selectedYear, string selectedMonth,
        IList<Domain.Entities.Consumption> selectedYearEnergies, IList<Domain.Entities.Consumption> comparisonYearEnergies)
    {
        var selectedMonthInt = DateTime.ParseExact(selectedMonth, "MMMM", CultureInfo.InvariantCulture).Month;
        var comparisonMonthInt = GetComparisonMonth(selectedYear, selectedMonthInt);

        var selectedYearEnergiesByType = selectedYearEnergies.Where(x => x.Resource.Name == type && x.Resource.Unit == unit).ToList();
        var comparisonYearEnergiesByType = comparisonYearEnergies.Where(x => x.Resource.Name == type && x.Resource.Unit == unit).ToList();

        var selectedMonthEnergies = selectedYearEnergiesByType.Where(x => x.Date.Value.Month == selectedMonthInt).ToList();
        var comparisonMonthEnergies = comparisonYearEnergiesByType.Where(x => x.Date.Value.Month == comparisonMonthInt).ToList();

        var yearTotal = selectedYearEnergiesByType.Sum(x => x.Value);
        var yearAverage = selectedYearEnergiesByType.Count == 0 ? yearTotal : yearTotal / selectedYearEnergiesByType.Count;
        var yearMin = selectedYearEnergiesByType.Select(x => x.Value).DefaultIfEmpty(0).Min();
        var yearMax = selectedYearEnergiesByType.Select(x => x.Value).DefaultIfEmpty(0).Max();

        var compYearTotal = comparisonYearEnergiesByType.Sum(x => x.Value);
        var compYearDiff = CalculateYearDiff(selectedYear, yearTotal, compYearTotal);

        var compMonthTotal = comparisonMonthEnergies.Sum(x => x.Value);
        var selectedMonthTotal = selectedMonthEnergies.Sum(x => x.Value);
        var compMonthDiff = CalculateMonthDiff(selectedYear, selectedMonthInt, selectedMonthTotal, compMonthTotal);

        return new ConsumptionStatsResponse(new ConsumptionStatsResourceResponse(type, unit, color), selectedMonthTotal, yearTotal, yearAverage,
            yearMin, yearMax, compYearTotal, compYearDiff, compMonthTotal, compMonthDiff);
    }

    private static decimal CalculateYearDiff(int selectedYear, decimal selectedYearTotal, decimal compYearTotal)
    {
        var currentYear = DateTime.Now.Year;

        return selectedYear == currentYear ? selectedYearTotal - compYearTotal : compYearTotal - selectedYearTotal;
    }

    private static decimal CalculateMonthDiff(int selectedYear, int selectedMonth, decimal selectedMonthTotal, decimal compMonthTotal)
    {
        var currentYear = DateTime.Now.Year;
        var currentMonth = DateTime.Now.Month;

        return selectedYear == currentYear && selectedMonth == currentMonth
            ? selectedMonthTotal - compMonthTotal
            : compMonthTotal - selectedMonthTotal;
    }
}
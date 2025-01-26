using System.Globalization;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Modules.Energies;

public record EnergyStatsTypeResponse(EnergyStatsResponse Electricity, EnergyStatsResponse Gas, EnergyStatsResponse Water);

public record EnergyStatsResponse(
    decimal MonthTotal,
    decimal YearTotal,
    decimal YearAverage,
    decimal YearMin,
    decimal YearMax,
    decimal ComparisonYear,
    decimal ComparisonYearDiff,
    decimal ComparisonMonth,
    decimal ComparisonMonthDiff);

public static class GetStatsEnergy
{
    public static RouteGroupBuilder MapGetStatsEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/stats", HandleAsync);

        return groupBuilder;
    }

    /// <summary>
    /// Get the energy statistics for the selected year and month.
    /// The statistics include the total, average, min, and max values for the selected year.
    /// If the selected year or month is the current year or month, the comparison year or month is the previous year or month.
    /// If the selected year or month is in the past, the comparison year or month is the current year or month.
    /// </summary>
    /// <param name="selectedYear"></param>
    /// <param name="selectedMonth"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Ok<EnergyStatsTypeResponse>> HandleAsync([FromQuery(Name = "year")] int selectedYear,
        [FromQuery(Name = "month")] string selectedMonth, AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var selectedYearEnergies = await dbContext.Energy
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Year == selectedYear)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var comparisonYear = GetComparisonYear(selectedYear);
        var comparisonYearEnergies = await dbContext.Energy
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Year == comparisonYear)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var electricityStats = GetStats(EnergyType.Electricity, selectedYear, selectedMonth, selectedYearEnergies, comparisonYearEnergies);
        var gasStats = GetStats(EnergyType.Gas, selectedYear, selectedMonth, selectedYearEnergies, comparisonYearEnergies);
        var waterStats = GetStats(EnergyType.Water, selectedYear, selectedMonth, selectedYearEnergies, comparisonYearEnergies);

        return TypedResults.Ok(new EnergyStatsTypeResponse(electricityStats, gasStats, waterStats));
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
    /// Get the comparison month based on the selected year and month
    /// If the selected year is the current year, the comparison month is the previous month
    /// If the selected year is in the past, the comparison month is the current month
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

    private static EnergyStatsResponse GetStats(EnergyType type, int selectedYear, string selectedMonth, List<Energy> selectedYearEnergies,
        List<Energy> comparisonYearEnergies)
    {
        var selectedMonthInt = DateTime.ParseExact(selectedMonth, "MMMM", CultureInfo.InvariantCulture).Month;
        var comparisonMonthInt = GetComparisonMonth(selectedYear, selectedMonthInt);

        var selectedYearEnergiesByType = selectedYearEnergies.Where(x => x.Type == type).ToList();
        var comparisonYearEnergiesByType = comparisonYearEnergies.Where(x => x.Type == type).ToList();

        var selectedMonthEnergies = selectedYearEnergiesByType.Where(x => x.Date.Month == selectedMonthInt).ToList();
        var comparisonMonthEnergies = comparisonYearEnergiesByType.Where(x => x.Date.Month == comparisonMonthInt).ToList();

        var yearTotal = selectedYearEnergiesByType.Sum(x => x.Value);
        var yearAverage = selectedYearEnergiesByType.Count == 0 ? yearTotal : yearTotal / selectedYearEnergiesByType.Count;
        var yearMin = selectedYearEnergiesByType.Select(x => x.Value).DefaultIfEmpty(0).Min();
        var yearMax = selectedYearEnergiesByType.Select(x => x.Value).DefaultIfEmpty(0).Max();

        var compYearTotal = comparisonYearEnergiesByType.Sum(x => x.Value);
        var compYearDiff = CalculateYearDiff(selectedYear, yearTotal, compYearTotal);

        var compMonthTotal = comparisonMonthEnergies.Sum(x => x.Value);
        var selectedMonthTotal = selectedMonthEnergies.Sum(x => x.Value);
        var compMonthDiff = CalculateMonthDiff(selectedYear, selectedMonthInt, selectedMonthTotal, compMonthTotal);

        return new EnergyStatsResponse(selectedMonthTotal, yearTotal, yearAverage, yearMin, yearMax, compYearTotal, compYearDiff, compMonthTotal,
            compMonthDiff);
    }

    private static decimal CalculateYearDiff(int selectedYear, decimal selectedYearTotal, decimal compYearTotal)
    {
        var currentYear = DateTime.Now.Year;

        if (selectedYear == currentYear)
        {
            return selectedYearTotal - compYearTotal;
        }

        return compYearTotal - selectedYearTotal;
    }

    private static decimal CalculateMonthDiff(int selectedYear, int selectedMonth, decimal selectedMonthTotal, decimal compMonthTotal)
    {
        var currentYear = DateTime.Now.Year;
        var currentMonth = DateTime.Now.Month;

        if (selectedYear == currentYear)
        {
            if (selectedMonth == currentMonth)
            {
                return selectedMonthTotal - compMonthTotal;
            }

            return compMonthTotal - selectedMonthTotal;
        }

        return compMonthTotal - selectedMonthTotal;
    }
}
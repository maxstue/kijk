using System.Globalization;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Modules.Energies;

public record EnergyStatsTypeResponse(EnergyStatsResponse Electricity, EnergyStatsResponse Gas, EnergyStatsResponse Water);

public record EnergyStatsResponse(
    decimal Total,
    decimal Average,
    decimal Min,
    decimal Max,
    decimal PrevYear,
    decimal PrevYearDiff,
    decimal PrevMonth,
    decimal PrevMonthDiff);

public static class GetStatsEnergy
{
    public static RouteGroupBuilder MapGetStatsEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/stats", HandleAsync);

        return groupBuilder;
    }

    private static async Task<Ok<EnergyStatsTypeResponse>> HandleAsync([FromQuery(Name = "year")] int year, [FromQuery(Name = "month")] string month,
        AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var wantedMonthInt = DateTime.ParseExact(month, "MMMM", CultureInfo.InvariantCulture).Month;

        var energies = await dbContext.Energy
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Year == year)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var wantedMonthEnergies = energies.Where(x => x.Date.Month == wantedMonthInt).ToList();

        var prevYearEnergies = await dbContext.Energy
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId)
            .Where(x => x.Date.Year == year - 1)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var previousMonthEnergies = prevYearEnergies.Where(x => x.Date.Month == wantedMonthInt).ToList();

        var electricity = wantedMonthEnergies.Where(x => x.Type == EnergyType.Electricity).ToList();
        var electricityPrevYear = prevYearEnergies.Where(x => x.Type == EnergyType.Electricity).ToList();
        var electricityPrevMonth = previousMonthEnergies.Where(x => x.Type == EnergyType.Electricity).ToList();
        var electricityStats = GetStats(electricity, electricityPrevYear, electricityPrevMonth);

        var gas = wantedMonthEnergies.Where(x => x.Type == EnergyType.Gas).ToList();
        var gasPrevYear = prevYearEnergies.Where(x => x.Type == EnergyType.Gas).ToList();
        var gasPrevMonth = previousMonthEnergies.Where(x => x.Type == EnergyType.Gas).ToList();
        var gasStats = GetStats(gas, gasPrevYear, gasPrevMonth);

        var water = wantedMonthEnergies.Where(x => x.Type == EnergyType.Water).ToList();
        var waterPrevYear = prevYearEnergies.Where(x => x.Type == EnergyType.Water).ToList();
        var waterPrevMonth = previousMonthEnergies.Where(x => x.Type == EnergyType.Water).ToList();
        var waterStats = GetStats(water, waterPrevYear, waterPrevMonth);

        return TypedResults.Ok(new EnergyStatsTypeResponse(electricityStats, gasStats, waterStats));
    }

    private static EnergyStatsResponse GetStats(List<Energy> energies, List<Energy> prevYearEnergies, List<Energy> prevMonthEnergies)
    {
        var total = energies.Sum(x => x.Value);
        var average = total / energies.Count;
        var min = energies.Min(x => x.Value);
        var max = energies.Max(x => x.Value);

        var prevYearTotal = prevYearEnergies.Sum(x => x.Value);
        var prevYearDiff = total - prevYearTotal;

        var prevMonthTotal = prevMonthEnergies.Sum(x => x.Value);
        var prevMonthDiff = total - prevMonthTotal;

        return new EnergyStatsResponse(total, average, min, max, prevYearTotal, prevYearDiff, prevMonthTotal, prevMonthDiff);
    }
}
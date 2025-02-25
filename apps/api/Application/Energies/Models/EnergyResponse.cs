using Kijk.Shared;

namespace Kijk.Application.Energies.Models;

public record EnergyResponse(Guid Id, string Name, string? Description, decimal Value, EnergyType Type, DateTime Date);

public record GetByIdEnergyResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Value,
    EnergyType Type,
    DateTime CreatedAt);

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

public record EnergyYearsResponse(List<int> Years);
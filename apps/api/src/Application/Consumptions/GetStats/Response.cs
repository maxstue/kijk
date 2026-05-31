namespace Kijk.Application.Consumptions.GetStats;

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
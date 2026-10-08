namespace Kijk.Application.Consumptions.GetStats;

/// <summary>Consumption statistics of the active household.</summary>
/// <param name="Stats">One entry per resource.</param>
public record GetStatsConsumptionsResponseWrapper(IList<ConsumptionStatsResponse> Stats);

/// <summary>Consumption statistics of one resource for the selected year and month.</summary>
/// <param name="Resource">The resource.</param>
/// <param name="MonthTotal">Total of the selected month.</param>
/// <param name="YearTotal">Total of the selected year.</param>
/// <param name="YearAverage">Average monthly total of the selected year (months with entries only).</param>
/// <param name="YearMin">Lowest monthly total of the selected year.</param>
/// <param name="YearMax">Highest monthly total of the selected year.</param>
/// <param name="ComparisonYear">Total of the comparison year (previous year for the current year, otherwise the current year).</param>
/// <param name="ComparisonYearDiff">Difference between the selected and the comparison year.</param>
/// <param name="ComparisonMonth">Total of the comparison month (previous month for the current month, otherwise the current month).</param>
/// <param name="ComparisonMonthDiff">Difference between the selected and the comparison month.</param>
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

/// <summary>The resource a statistic belongs to.</summary>
/// <param name="Id">The resource id.</param>
/// <param name="Name">The resource name.</param>
/// <param name="Unit">The unit symbol.</param>
/// <param name="Color">The display color.</param>
/// <param name="Icon">The icon name.</param>
public record ConsumptionStatsResourceResponse(Guid Id, string Name, string Unit, string Color, string Icon);
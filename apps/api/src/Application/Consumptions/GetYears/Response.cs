namespace Kijk.Application.Consumptions.GetYears;

/// <summary>The years with consumptions in the active space.</summary>
/// <param name="Years">The years.</param>
public record GetYearsConsumptionQueryResponse(IList<int> Years);
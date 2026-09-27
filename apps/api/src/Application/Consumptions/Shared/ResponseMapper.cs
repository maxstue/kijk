using Kijk.Domain.Entities;

namespace Kijk.Application.Consumptions.Shared;

/// <summary>
/// Maps consumption entities to API responses.
/// </summary>
public static class ConsumptionResponseMapper
{
    /// <summary>
    /// Maps a materialized consumption entity to a response.
    /// </summary>
    /// <param name="source">The consumption to map.</param>
    /// <returns>The mapped response.</returns>
    public static ConsumptionResponse ToResponse(this Consumption source) => new(
        source.Id,
        source.Name,
        source.Description,
        source.Value,
        source.ValueType,
        source.StartsNewMeterSegment,
        source.CalculatedConsumption,
        new ConsumptionResourceResponse(source.Resource.Id, source.Resource.Name, source.Resource.Unit.Symbol,
            source.Resource.Color, source.Resource.Icon),
        source.Date);

    /// <summary>
    /// Projects consumption entities to responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The consumption query.</param>
    /// <returns>The projected response query.</returns>
    public static IQueryable<ConsumptionResponse> ToResponse(this IQueryable<Consumption> source) =>
        source.Select(consumption => new ConsumptionResponse(
            consumption.Id,
            consumption.Name,
            consumption.Description,
            consumption.Value,
            consumption.ValueType,
            consumption.StartsNewMeterSegment,
            consumption.CalculatedConsumption,
            new ConsumptionResourceResponse(
                consumption.Resource.Id,
                consumption.Resource.Name,
                consumption.Resource.Unit.Symbol,
                consumption.Resource.Color,
                consumption.Resource.Icon),
            consumption.Date));
}
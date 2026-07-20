using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Consumptions.Shared;

/// <summary>
/// Maps consumption entities to API responses.
/// </summary>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class ConsumptionResponseMapper
{
    /// <summary>
    /// Maps a materialized consumption entity to a response.
    /// </summary>
    /// <param name="source">The consumption to map.</param>
    /// <returns>The mapped response.</returns>
    public static partial ConsumptionResponse ToResponse(this Consumption source);

    /// <summary>
    /// Projects consumption entities to responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The consumption query.</param>
    /// <returns>The projected response query.</returns>
    public static partial IQueryable<ConsumptionResponse> ProjectToResponse(this IQueryable<Consumption> source);

    private static DateTime MapDate(MonthYear source) => source.Value;
}
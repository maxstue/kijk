using Kijk.Domain.Entities;

namespace Kijk.Application.Resources.Shared;

/// <summary>
/// Maps resource entities to API responses.
/// </summary>
public static class ResourceResponseMapper
{
    /// <summary>
    /// Maps a materialized resource entity to a response.
    /// </summary>
    /// <param name="source">The resource to map.</param>
    /// <returns>The mapped response.</returns>
    public static ResourceResponse ToResponse(this Resource source) =>
        new(source.Id, source.Name, source.Color, source.Icon, source.UnitId, source.Unit.Symbol, source.Unit.Name,
            source.Unit.QuantityKey, source.CreatorType);

    /// <summary>
    /// Projects resource entities to responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The resource query.</param>
    /// <returns>The projected response query.</returns>
    public static IQueryable<ResourceResponse> ToResponse(this IQueryable<Resource> source) =>
        source.Select(resource => new ResourceResponse(
            resource.Id,
            resource.Name,
            resource.Color,
            resource.Icon,
            resource.UnitId,
            resource.Unit.Symbol,
            resource.Unit.Name,
            resource.Unit.QuantityKey,
            resource.CreatorType));
}
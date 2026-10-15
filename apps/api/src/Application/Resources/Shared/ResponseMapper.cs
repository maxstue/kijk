using Kijk.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Resources.Shared;

/// <summary>
/// Maps resource entities to API responses.
/// </summary>
[Mapper]
public static partial class ResourceResponseMapper
{
    /// <summary>
    /// Maps a materialized resource entity to a response.
    /// </summary>
    /// <param name="source">The resource to map.</param>
    /// <returns>The mapped response.</returns>
    [MapProperty(new[] { nameof(Resource.Unit), nameof(Unit.Symbol) }, nameof(ResourceResponse.Unit))]
    [MapProperty(new[] { nameof(Resource.Unit), nameof(Unit.QuantityKey) }, nameof(ResourceResponse.QuantityKey))]
    public static partial ResourceResponse ToResponse(this Resource source);

    /// <summary>
    /// Projects resource entities to responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The resource query.</param>
    /// <returns>The projected response query.</returns>
    public static partial IQueryable<ResourceResponse> ToResponse(this IQueryable<Resource> source);
}
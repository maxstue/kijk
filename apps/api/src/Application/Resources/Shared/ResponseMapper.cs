using Kijk.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Resources.Shared;

/// <summary>
/// Maps resource entities to API responses.
/// </summary>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class ResourceResponseMapper
{
    /// <summary>
    /// Maps a materialized resource entity to a response.
    /// </summary>
    /// <param name="source">The resource to map.</param>
    /// <returns>The mapped response.</returns>
    public static partial ResourceResponse ToResponse(this Resource source);

    /// <summary>
    /// Projects resource entities to responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The resource query.</param>
    /// <returns>The projected response query.</returns>
    public static partial IQueryable<ResourceResponse> ProjectToResponse(this IQueryable<Resource> source);
}
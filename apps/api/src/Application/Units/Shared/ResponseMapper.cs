using Kijk.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Units.Shared;

/// <summary>
/// Maps unit entities to API responses.
/// </summary>
[Mapper]
public static partial class UnitResponseMapper
{
    /// <summary>
    /// Projects unit entities to responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The unit query.</param>
    /// <returns>The projected response query.</returns>
    public static partial IQueryable<UnitResponse> ToResponse(this IQueryable<Unit> source);
}
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Units.Shared;

namespace Kijk.Application.Units.List;

/// <summary>
/// Lists the system unit catalog.
/// </summary>
public sealed class ListHandler(IAppDbContext dbContext)
{
    /// <summary>Gets all units, ordered by quantity and name.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The units.</returns>
    public Task<List<UnitResponse>> HandleAsync(CancellationToken cancellationToken) =>
        dbContext.Units
            .AsNoTracking()
            .OrderBy(unit => unit.QuantityKey)
            .ThenBy(unit => unit.Name)
            .ToResponse()
            .ToListAsync(cancellationToken);
}
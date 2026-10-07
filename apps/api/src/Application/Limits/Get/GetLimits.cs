using Kijk.Application.Limits.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Limits.Get;

/// <summary>
/// Retrieves and evaluates consumption limits for the active space.
/// </summary>
public sealed class GetLimitsHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    /// <summary>Gets all limits of the active space with their current evaluation.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The limits.</returns>
    public async Task<Result<List<LimitResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var limits = await dbContext.Limits
            .Include(item => item.Resource)
            .ThenInclude(resource => resource.Unit)
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId)
            .OrderBy(item => item.Resource.Name)
            .ThenBy(item => item.Period)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var consumptions = await GetRelevantConsumptionsAsync(limits.Select(item => item.ResourceId), cancellationToken);
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        return limits.Select(limit => LimitEvaluation.ToResponse(limit, consumptions, utcNow)).ToList();
    }

    /// <summary>Gets a limit of the active space with its current evaluation.</summary>
    /// <param name="id">The limit id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The limit, or a not-found error.</returns>
    public async Task<Result<LimitResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var limit = await dbContext.Limits
            .Include(item => item.Resource)
            .ThenInclude(resource => resource.Unit)
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (limit is null)
        {
            return Error.NotFound("Consumption limit could not be found");
        }

        var consumptions = await GetRelevantConsumptionsAsync([limit.ResourceId], cancellationToken);
        return LimitEvaluation.ToResponse(limit, consumptions, timeProvider.GetUtcNow().UtcDateTime);
    }

    private async Task<List<Domain.Entities.Consumption>> GetRelevantConsumptionsAsync(
        IEnumerable<Guid> resourceIds,
        CancellationToken cancellationToken)
    {
        var ids = resourceIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return [];
        }

        var yearStart = new DateTime(timeProvider.GetUtcNow().Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        return await dbContext.Consumptions
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId
                           && ids.Contains(item.ResourceId)
                           && item.Date >= yearStart)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
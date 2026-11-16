using Kijk.Application.Limits.Shared;
using Kijk.Application.Shared.Paging;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Limits.Queries;

/// <summary>
/// Retrieves and evaluates consumption limits for the active space.
/// </summary>
public sealed class QueriesHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>Searches and pages limits before evaluating their consumption.</summary>
    /// <param name="request">Optional search, sort and page.</param>
    /// <param name="resourceId">An optional resource.</param>
    /// <param name="period">An optional recurring period.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The matching limits with current evaluations.</returns>
    public async Task<Result<PageResponse<LimitResponse>>> ListAsync(
        ListRequest<LimitSort> request, Guid? resourceId, Period? period, CancellationToken cancellationToken)
    {
        var query = dbContext.Limits.Include(item => item.Resource.Unit)
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId).AsNoTracking();
        if (request.Search.ToContainsPattern() is { } pattern)
        {
            query = query.Where(item => EF.Functions.ILike(item.Name, pattern, PagingExtensions.LikeEscape)
                || EF.Functions.Like(item.Resource.Name, pattern, PagingExtensions.LikeEscape));
        }

        if (resourceId is not null)
        {
            query = query.Where(item => item.ResourceId == resourceId);
        }

        if (period is not null)
        {
            query = query.Where(item => item.Period == period);
        }

        var ordered = request.Sort switch
        {
            LimitSort.Name => query.OrderBy(item => item.Name, request.Descending),
            LimitSort.Period => query.OrderBy(item => item.Period, request.Descending).ThenBy(item => item.Resource.Name),
            _ => query.OrderBy(item => item.Resource.Name, request.Descending).ThenBy(item => item.Period)
        };
        var page = await ordered.ThenBy(item => item.Id).ToPageAsync(request.Page, request.PageSize, cancellationToken);
        var consumptions = await GetRelevantConsumptionsAsync(page.Items.Select(item => item.ResourceId), cancellationToken);
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        return page.Map(limit => LimitEvaluation.ToResponse(limit, consumptions, utcNow));
    }

    /// <summary>Gets a limit of the active space with its current evaluation.</summary>
    /// <param name="id">The limit id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The limit, or a not-found error.</returns>
    public async Task<Result<LimitResponse>> DetailsAsync(Guid id, CancellationToken cancellationToken)
    {
        var limit = await dbContext.Limits
            .Include(item => item.Resource.Unit)
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

        return await dbContext.Consumptions
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId
                           && ids.Contains(item.ResourceId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
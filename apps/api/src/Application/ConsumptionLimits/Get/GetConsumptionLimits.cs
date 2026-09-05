using Kijk.Application.ConsumptionLimits.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.ConsumptionLimits.Get;

/// <summary>
/// Retrieves and evaluates consumption limits for the active household.
/// </summary>
public sealed class GetConsumptionLimitsHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    public async Task<Result<List<ConsumptionLimitResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var limits = await dbContext.ConsumptionsLimits
            .Include(item => item.Resource)
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId)
            .OrderBy(item => item.Resource.Name)
            .ThenBy(item => item.Period)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var consumptions = await GetRelevantConsumptionsAsync(limits.Select(item => item.ResourceId), cancellationToken);
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        return limits.Select(limit => ConsumptionLimitEvaluation.ToResponse(limit, consumptions, utcNow)).ToList();
    }

    public async Task<Result<ConsumptionLimitResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var limit = await dbContext.ConsumptionsLimits
            .Include(item => item.Resource)
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (limit is null)
        {
            return Error.NotFound("Consumption limit could not be found");
        }

        var consumptions = await GetRelevantConsumptionsAsync([limit.ResourceId], cancellationToken);
        return ConsumptionLimitEvaluation.ToResponse(limit, consumptions, timeProvider.GetUtcNow().UtcDateTime);
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
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId
                           && ids.Contains(item.ResourceId)
                           && item.Date.Value >= yearStart)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
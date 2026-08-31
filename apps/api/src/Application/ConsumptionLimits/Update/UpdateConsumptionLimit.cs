using Kijk.Application.ConsumptionLimits.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.ConsumptionLimits.Update;

/// <summary>
/// Updates consumption limits owned by the active household.
/// </summary>
public sealed class UpdateConsumptionLimitHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    public async Task<Result<ConsumptionLimitResponse>> UpdateAsync(
        Guid id,
        UpdateConsumptionLimitRequest request,
        CancellationToken cancellationToken)
    {
        var limit = await dbContext.ConsumptionsLimits
            .Include(item => item.Resource)
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (limit is null)
        {
            return Error.NotFound("Consumption limit could not be found");
        }

        var conflict = await dbContext.ConsumptionsLimits.AnyAsync(
            item => item.Id != id
                    && item.HouseholdId == currentUser.ActiveHouseholdId
                    && item.ResourceId == limit.ResourceId
                    && item.Period == request.Period,
            cancellationToken);
        if (conflict)
        {
            return Error.Conflict("A consumption limit already exists for this resource and period");
        }

        limit.Update(request.Name.Trim(), request.Description?.Trim(), request.Limit, request.Period, request.Active);
        await dbContext.SaveChangesAsync(cancellationToken);

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var (start, end) = ConsumptionLimitEvaluation.GetPeriodRange(limit.Period, utcNow);
        var consumptions = await dbContext.Consumptions
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId
                           && item.ResourceId == limit.ResourceId
                           && item.Date.Value >= start
                           && item.Date.Value < end)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return ConsumptionLimitEvaluation.ToResponse(limit, consumptions, utcNow);
    }
}
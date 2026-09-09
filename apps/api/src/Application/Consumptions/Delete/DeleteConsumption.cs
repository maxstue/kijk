using Kijk.Application.ConsumptionLimits.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Services;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Delete;

/// <summary>
/// Handler for deleting a consumption.
/// </summary>
public class DeleteConsumptionHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    ILogger<DeleteConsumptionHandler> logger) : IHandler
{
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var foundEntity = await dbContext.Consumptions
            .FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (foundEntity == null)
        {
            logger.LogWarning("Consumption with id '{Id}' not found", id);
            return Error.NotFound("Consumption not found");
        }

        var remainingTimeline = await dbContext.Consumptions
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId
                           && item.ResourceId == foundEntity.ResourceId
                           && item.Id != foundEntity.Id)
            .ToListAsync(cancellationToken);
        var before = ConsumptionLimitOccurrence.Capture(remainingTimeline.Append(foundEntity));

        var calculation = ConsumptionTimelineCalculator.Recalculate(remainingTimeline);
        if (calculation.IsError)
        {
            logger.LogWarning(
                "Could not delete consumption '{ConsumptionId}': {Reason}",
                id,
                calculation.Error.Description);
            return calculation.Error;
        }

        dbContext.Consumptions.Remove(foundEntity);
        await ConsumptionLimitOccurrence.RecordAsync(
            dbContext,
            foundEntity.HouseholdId,
            before,
            remainingTimeline,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
using Kijk.Application.ConsumptionLimits.Shared;
using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Update;

/// <summary>
/// Handler for updating consumption.
/// </summary>
public class UpdateConsumptionHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider, ILogger<UpdateConsumptionHandler> logger) : IHandler
{
    public async Task<Result<ConsumptionResponse>> UpdateAsync(Guid id, UpdateConsumptionRequest request, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .Include(x => x.Consumptions)
            .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

        if (household is null)
        {
            logger.LogWarning("Household with id '{Id}' was not found", currentUser.ActiveHouseholdId);
            return Error.NotFound("Household not found");
        }

        var existingResourceUsage = await dbContext.Consumptions
            .Include(resourceUsage => resourceUsage.Resource)
            .FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (existingResourceUsage is null)
        {
            logger.LogWarning("Resource consumption with id '{Id}' was not found", id);
            return Error.NotFound("Consumption not found");
        }
        var originalResourceId = existingResourceUsage.ResourceId;
        var resourceId = request.ResourceId ?? existingResourceUsage.ResourceId;
        var originalTimeline = await dbContext.Consumptions
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId
                           && item.ResourceId == originalResourceId)
            .ToListAsync(cancellationToken);

        List<Consumption>? destinationTimeline = null;
        Resource? destinationResource = null;

        if (resourceId != originalResourceId)
        {
            var resource = await dbContext
                .GetUserAvailableResources(currentUser)
                .FirstOrDefaultAsync(resource => resource.Id == resourceId, cancellationToken);
            if (resource is null)
            {
                logger.LogWarning("Resource with id '{ResourceId}' is not available to user '{UserId}'", resourceId,
                    currentUser.Id);
                return Error.NotFound("Resource is not available in the active household");
            }

            destinationResource = resource;

            destinationTimeline = await dbContext.Consumptions
                .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId
                               && item.ResourceId == resourceId)
                .ToListAsync(cancellationToken);
        }

        var before = ConsumptionLimitOccurrence.Capture(
            originalTimeline.Concat(destinationTimeline ?? []));

        var requestedDate = request.Date ?? existingResourceUsage.Date;
        existingResourceUsage.Name = request.Name ?? existingResourceUsage.Name;
        existingResourceUsage.Value = request.Value ?? existingResourceUsage.Value;
        existingResourceUsage.ValueType = (ConsumptionValueType)request.ValueType;
        if (destinationResource is not null)
        {
            existingResourceUsage.ResourceId = destinationResource.Id;
            existingResourceUsage.Resource = destinationResource;
        }
        existingResourceUsage.Date = new DateTime(
            requestedDate.Year,
            requestedDate.Month,
            requestedDate.Day,
            0,
            0,
            0,
            DateTimeKind.Utc);

        Result<bool> calculation;
        if (destinationTimeline is null)
        {
            calculation = ConsumptionTimelineCalculator.Recalculate(originalTimeline);
        }
        else
        {
            originalTimeline.Remove(existingResourceUsage);
            destinationTimeline.Add(existingResourceUsage);

            calculation = ConsumptionTimelineCalculator.Recalculate(originalTimeline);
            if (calculation.IsSuccess)
            {
                calculation = ConsumptionTimelineCalculator.Recalculate(destinationTimeline);
            }
        }

        if (calculation.IsError)
        {
            logger.LogWarning(
                "Could not update consumption '{ConsumptionId}': {Reason}",
                id,
                calculation.Error.Description);
            return calculation.Error;
        }

        await ConsumptionLimitOccurrence.RecordAsync(
            dbContext,
            household.Id,
            before,
            originalTimeline.Concat(destinationTimeline ?? []).ToList(),
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return existingResourceUsage.ToResponse();
    }
}
using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Limits.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Create;

/// <summary>
/// Handler for creating a new consumption.
/// </summary>
public class CreateConsumptionHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider, ILogger<CreateConsumptionHandler> logger) : IHandler
{
    /// <summary>Records a consumption in the active space and recalculates later meter readings.</summary>
    /// <param name="request">The consumption data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created consumption.</returns>
    public async Task<Result<ConsumptionResponse>> CreateAsync(CreateConsumptionRequest request, CancellationToken cancellationToken)
    {
        // Load space without including the Consumptions navigation to avoid materializing it as a fixed-size array during fixup
        var space = await dbContext.Spaces
            .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveSpaceId, cancellationToken);

        if (space is null)
        {
            logger.LogWarning("Space with id {SpaceId} not found", currentUser.ActiveSpaceId);
            return Error.NotFound("Space not found");
        }

        var resource = await dbContext
            .GetUserAvailableResources(currentUser)
            .Include(item => item.Unit)
            .FirstOrDefaultAsync(resource => resource.Id == request.ResourceId, cancellationToken);
        if (resource is null)
        {
            logger.LogWarning("Resource with id '{ResourceId}' is not available to user '{UserId}'", request.ResourceId,
                currentUser.Id);
            return Error.NotFound("Resource is not available in the active space");
        }

        var consumption = Consumption.Create(
            request.Name,
            resource,
            space,
            request.Date,
            new ConsumptionReading(
                request.Value,
                (ConsumptionValueType)request.ValueType,
                CalculatedConsumption: 0m,
                request.StartsNewMeterSegment));

        var existingConsumptions = await dbContext.Consumptions
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId
                           && item.ResourceId == request.ResourceId)
            .ToListAsync(cancellationToken);
        var before = LimitOccurrence.Capture(existingConsumptions);

        var calculation = ConsumptionTimelineCalculator.CalculateInsertion(consumption, existingConsumptions);
        if (calculation.IsError)
        {
            logger.LogWarning(
                "Could not add consumption for resource '{ResourceId}' on {Date:yyyy-MM-dd}: {Reason}",
                request.ResourceId,
                request.Date,
                calculation.Error.Description);
            return calculation.Error;
        }

        dbContext.Consumptions.Add(consumption);
        await LimitOccurrence.RecordAsync(
            dbContext,
            space.Id,
            before,
            existingConsumptions.Append(consumption).ToList(),
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return consumption.ToResponse();
    }
}
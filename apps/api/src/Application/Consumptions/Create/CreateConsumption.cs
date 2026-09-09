using Kijk.Application.ConsumptionLimits.Shared;
using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Create;

/// <summary>
/// Handler for creating a new consumption.
/// </summary>
public class CreateConsumptionHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider, ILogger<CreateConsumptionHandler> logger) : IHandler
{
    public async Task<Result<ConsumptionResponse>> CreateAsync(CreateConsumptionRequest request, CancellationToken cancellationToken)
    {
        // Load household without including the Consumptions navigation to avoid materializing it as a fixed-size array during fixup
        var household = await dbContext.Households
            .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

        if (household is null)
        {
            logger.LogWarning("Household with id {HouseholdId} not found", currentUser.ActiveHouseholdId);
            return Error.NotFound("Household not found");
        }

        var resource = await dbContext
            .GetUserAvailableResources(currentUser)
            .FirstOrDefaultAsync(resource => resource.Id == request.ResourceId, cancellationToken);
        if (resource is null)
        {
            logger.LogWarning("Resource with id '{ResourceId}' is not available to user '{UserId}'", request.ResourceId,
                currentUser.Id);
            return Error.NotFound("Resource is not available in the active household");
        }

        var consumption = Consumption.Create(
            request.Name,
            resource,
            request.Value,
            household,
            request.Date,
            (ConsumptionValueType)request.ValueType,
            calculatedConsumption: 0m);

        var existingConsumptions = await dbContext.Consumptions
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId
                           && item.ResourceId == request.ResourceId)
            .ToListAsync(cancellationToken);
        var before = ConsumptionLimitOccurrence.Capture(existingConsumptions);

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
        await ConsumptionLimitOccurrence.RecordAsync(
            dbContext,
            household.Id,
            before,
            existingConsumptions.Append(consumption).ToList(),
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return consumption.ToResponse();
    }
}
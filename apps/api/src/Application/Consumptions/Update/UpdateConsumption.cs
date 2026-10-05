using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Limits.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Application.Units.Shared;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Update;

/// <summary>
/// Handler for updating consumption.
/// </summary>
public class UpdateConsumptionHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    IUnitConversionService unitConversionService,
    ILogger<UpdateConsumptionHandler> logger) : IHandler
{
    /// <summary>Updates a consumption of the active space and recalculates affected meter readings.</summary>
    /// <param name="id">The consumption id.</param>
    /// <param name="request">The changes.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated consumption.</returns>
    public async Task<Result<ConsumptionResponse>> UpdateAsync(Guid id, UpdateConsumptionRequest request, CancellationToken cancellationToken)
    {
        var space = await dbContext.Spaces
            .Include(x => x.Consumptions)
            .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveSpaceId, cancellationToken);

        if (space is null)
        {
            logger.LogWarning("Space with id '{Id}' was not found", currentUser.ActiveSpaceId);
            return Error.NotFound("Space not found");
        }

        var existingResourceUsage = await dbContext.Consumptions
            .Include(resourceUsage => resourceUsage.Resource.Unit.ReferenceUnit)
            .FirstOrDefaultAsync(x => x.Id == id && x.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (existingResourceUsage is null)
        {
            logger.LogWarning("Resource consumption with id '{Id}' was not found", id);
            return Error.NotFound("Consumption not found");
        }
        var originalResourceId = existingResourceUsage.ResourceId;
        var resourceId = request.ResourceId ?? existingResourceUsage.ResourceId;
        var originalTimeline = await dbContext.Consumptions
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId
                           && item.ResourceId == originalResourceId)
            .ToListAsync(cancellationToken);

        List<Consumption>? destinationTimeline = null;
        Resource? destinationResource = null;
        if (resourceId != originalResourceId)
        {
            destinationResource = await GetAvailableResourceAsync(resourceId, cancellationToken);
            if (destinationResource is null)
            {
                return Error.NotFound("Resource is not available in the active space");
            }

            destinationTimeline = await dbContext.Consumptions
                .Where(item => item.SpaceId == currentUser.ActiveSpaceId
                               && item.ResourceId == resourceId)
                .ToListAsync(cancellationToken);
        }

        var before = LimitOccurrence.Capture(
            originalTimeline.Concat(destinationTimeline ?? []));

        if (ApplyChanges(existingResourceUsage, request, destinationResource) is { } changeError)
        {
            return changeError;
        }

        var calculation = Recalculate(existingResourceUsage, originalTimeline, destinationTimeline);
        if (calculation.IsError)
        {
            logger.LogWarning(
                "Could not update consumption '{ConsumptionId}': {Reason}",
                id,
                calculation.Error.Description);
            return calculation.Error;
        }

        await LimitOccurrence.RecordAsync(
            dbContext,
            space.Id,
            before,
            originalTimeline.Concat(destinationTimeline ?? []).ToList(),
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return existingResourceUsage.ToResponse();
    }

    /// <summary>Loads a resource the current user may record consumptions for, including its unit.</summary>
    private async Task<Resource?> GetAvailableResourceAsync(Guid resourceId, CancellationToken cancellationToken)
    {
        var resource = await dbContext
            .GetUserAvailableResources(currentUser)
            .Include(item => item.Unit.ReferenceUnit)
            .FirstOrDefaultAsync(item => item.Id == resourceId, cancellationToken);
        if (resource is null)
        {
            logger.LogWarning("Resource with id '{ResourceId}' is not available to user '{UserId}'", resourceId, currentUser.Id);
        }

        return resource;
    }

    /// <summary>
    /// Applies the requested changes; when the resource changes without a new value, the value is converted into the
    /// unit of the new resource.
    /// </summary>
    private Error? ApplyChanges(Consumption consumption, UpdateConsumptionRequest request, Resource? destinationResource)
    {
        var requestedDate = request.Date ?? consumption.Date;
        consumption.Name = request.Name ?? consumption.Name;
        if (request.Value.HasValue)
        {
            consumption.Value = request.Value.Value;
        }
        else if (destinationResource is not null)
        {
            var converted = unitConversionService.Convert(consumption.Value, consumption.Resource.Unit, destinationResource.Unit);
            if (converted.IsError)
            {
                return converted.Error;
            }

            consumption.Value = converted.Value;
        }

        consumption.ValueType = (ConsumptionValueType)request.ValueType;
        if (request.StartsNewMeterSegment && consumption.ValueType != ConsumptionValueType.Absolute)
        {
            return Error.Validation("A new meter segment must start with an absolute meter reading");
        }

        consumption.StartsNewMeterSegment = request.StartsNewMeterSegment;
        if (destinationResource is not null)
        {
            consumption.ResourceId = destinationResource.Id;
            consumption.Resource = destinationResource;
        }

        consumption.Date = new DateTime(requestedDate.Year, requestedDate.Month, requestedDate.Day, 0, 0, 0, DateTimeKind.Utc);
        return null;
    }

    /// <summary>Recalculates the meter readings of the original and, after a resource change, the new timeline.</summary>
    private static Result<bool> Recalculate(Consumption consumption, List<Consumption> originalTimeline, List<Consumption>? destinationTimeline)
    {
        if (destinationTimeline is null)
        {
            return ConsumptionTimelineCalculator.Recalculate(originalTimeline);
        }

        originalTimeline.Remove(consumption);
        destinationTimeline.Add(consumption);

        var calculation = ConsumptionTimelineCalculator.Recalculate(originalTimeline);
        return calculation.IsSuccess ? ConsumptionTimelineCalculator.Recalculate(destinationTimeline) : calculation;
    }
}
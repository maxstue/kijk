using Kijk.Application.Resources.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Units.Shared;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources.Update;

/// <summary>
/// Handler for updating a resource.
/// </summary>
public class UpdateResourceHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    IUnitConversionService unitConversionService,
    ILogger<UpdateResourceHandler> logger) : IHandler
{
    /// <summary>Updates a custom resource of the active household.</summary>
    /// <param name="id">The resource id.</param>
    /// <param name="request">The new resource data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated resource.</returns>
    public async Task<Result<ResourceResponse>> UpdateAsync(Guid id, UpdateResourceRequest request, CancellationToken cancellationToken)
    {
        var resourceResult = await ResourceHelpers.GetModifiableResourceAsync(dbContext, currentUser, id, cancellationToken);
        if (resourceResult.IsError)
        {
            logger.LogWarning(
                "User '{UserId}' could not manage resource '{ResourceId}': {Reason}",
                currentUser.Id,
                id,
                resourceResult.Error.Description);
            return resourceResult.Error;
        }

        var resource = resourceResult.Value;

        var name = request.Name?.Trim() ?? resource.Name;
        var unitResult = await ResolveUnitAsync(resource, request.UnitId, cancellationToken);
        if (unitResult.IsError)
        {
            return unitResult.Error;
        }

        var unit = unitResult.Value;
        if (await ResourceHelpers.HasConflictAsync(dbContext, currentUser, name, unit.Id, id, cancellationToken))
        {
            logger.LogWarning("Resource with name '{Name}' and unit '{UnitId}' already exists", name, unit.Id);
            return Error.Conflict($"A resource with the name '{name}' and unit '{unit.Name}' already exists");
        }

        if (unit.Id != resource.UnitId && await ConvertToUnitAsync(resource, unit, cancellationToken) is { } conversionError)
        {
            return conversionError;
        }

        resource.Name = name;
        resource.Color = request.Color ?? resource.Color;
        resource.Icon = request.Icon ?? resource.Icon;
        resource.UnitId = unit.Id;
        resource.Unit = unit;

        await dbContext.SaveChangesAsync(cancellationToken);

        return resource.ToResponse();
    }

    /// <summary>Resolves the requested unit, which must measure the same quantity as the current unit.</summary>
    private async Task<Result<Unit>> ResolveUnitAsync(Resource resource, Guid? unitId, CancellationToken cancellationToken)
    {
        if (!unitId.HasValue || unitId.Value == resource.UnitId)
        {
            return resource.Unit;
        }

        var unit = await dbContext.GetAvailableUnits(currentUser)
            .Include(item => item.ReferenceUnit)
            .FirstOrDefaultAsync(item => item.Id == unitId.Value, cancellationToken);
        if (unit is null)
        {
            return Error.NotFound("Unit is not available in the active household");
        }

        return string.Equals(resource.Unit.QuantityKey, unit.QuantityKey, StringComparison.Ordinal)
            ? unit
            : Error.Validation($"'{resource.Unit.Name}' and '{unit.Name}' represent different quantities and cannot be converted");
    }

    /// <summary>Converts the resource's consumptions and limits into the new unit and recalculates the readings.</summary>
    private async Task<Error?> ConvertToUnitAsync(Resource resource, Unit unit, CancellationToken cancellationToken)
    {
        var consumptions = await dbContext.Consumptions
            .Where(item => item.ResourceId == resource.Id)
            .ToListAsync(cancellationToken);
        foreach (var consumption in consumptions)
        {
            var converted = unitConversionService.Convert(consumption.Value, resource.Unit, unit);
            if (converted.IsError)
            {
                return converted.Error;
            }

            consumption.Value = converted.Value;
        }

        var calculation = ConsumptionTimelineCalculator.Recalculate(consumptions);
        if (calculation.IsError)
        {
            return calculation.Error;
        }

        var limits = await dbContext.Limits
            .Where(item => item.ResourceId == resource.Id)
            .ToListAsync(cancellationToken);
        foreach (var limit in limits)
        {
            var converted = unitConversionService.Convert(limit.Threshold, resource.Unit, unit);
            if (converted.IsError)
            {
                return converted.Error;
            }

            limit.Update(limit.Name, limit.Description, converted.Value, limit.Period, limit.Active);
        }

        return null;
    }
}
using Kijk.Application.Resources.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Units.Shared;
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
        var unit = resource.Unit;
        if (request.UnitId.HasValue && request.UnitId.Value != resource.UnitId)
        {
            unit = await dbContext.GetAvailableUnits(currentUser)
                .Include(item => item.ReferenceUnit)
                .FirstOrDefaultAsync(item => item.Id == request.UnitId.Value, cancellationToken);
            if (unit is null)
            {
                return Error.NotFound("Unit is not available in the active household");
            }

            if (!string.Equals(resource.Unit.QuantityKey, unit.QuantityKey, StringComparison.Ordinal))
            {
                return Error.Validation($"'{resource.Unit.Name}' and '{unit.Name}' represent different quantities and cannot be converted");
            }
        }

        if (await ResourceHelpers.HasConflictAsync(dbContext, currentUser, name, unit.Id, id, cancellationToken))
        {
            logger.LogWarning("Resource with name '{Name}' and unit '{UnitId}' already exists", name, unit.Id);
            return Error.Conflict($"A resource with the name '{name}' and unit '{unit.Name}' already exists");
        }

        if (unit.Id != resource.UnitId)
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

            var limits = await dbContext.ConsumptionsLimits
                .Where(item => item.ResourceId == resource.Id)
                .ToListAsync(cancellationToken);
            foreach (var limit in limits)
            {
                var converted = unitConversionService.Convert(limit.Limit, resource.Unit, unit);
                if (converted.IsError)
                {
                    return converted.Error;
                }

                limit.Update(limit.Name, limit.Description, converted.Value, limit.Period, limit.Active);
            }
        }

        resource.Name = name;
        resource.Color = request.Color ?? resource.Color;
        resource.Icon = request.Icon ?? resource.Icon;
        resource.UnitId = unit.Id;
        resource.Unit = unit;

        await dbContext.SaveChangesAsync(cancellationToken);

        return resource.ToResponse();
    }
}
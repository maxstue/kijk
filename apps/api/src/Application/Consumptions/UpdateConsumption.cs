using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.ValueObjects;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions;

public record UpdateConsumptionRequest(string? Name, decimal? Value, Guid? ResourceId, DateTime? Date);

/// <summary>
/// Handler for updating consumption.
/// </summary>
public class UpdateConsumptionHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<UpdateConsumptionHandler> logger) : IHandler
{
    public async Task<Result<ConsumptionResponse>> UpdateAsync(Guid id, UpdateConsumptionRequest command, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .Include(x => x.Consumptions)
            .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

        if (household is null)
        {
            logger.LogError("Household with id '{Id}' was not found", currentUser.ActiveHouseholdId);
            return Error.NotFound($"Household for id '{currentUser.ActiveHouseholdId}' was not found");
        }

        var existingResourceUsage = await dbContext.Consumptions
            .Include(resourceUsage => resourceUsage.Resource)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (existingResourceUsage is null)
        {
            logger.LogError("Resource consumption with id '{Id}' was not found", id);
            return Error.NotFound($"Resource consumption for id '{id}' was not found");
        }

        existingResourceUsage.Name = command.Name ?? existingResourceUsage.Name;
        existingResourceUsage.Value = command.Value ?? existingResourceUsage.Value;
        existingResourceUsage.Date = command.Date is not null ? MonthYear.ParseDateTime(command.Date.Value) : existingResourceUsage.Date;
        existingResourceUsage.ResourceId = command.ResourceId ?? existingResourceUsage.ResourceId;


        await dbContext.SaveChangesAsync(cancellationToken);

        return new ConsumptionResponse(
            existingResourceUsage.Id,
            existingResourceUsage.Name,
            existingResourceUsage.Description,
            existingResourceUsage.Value,
            new(existingResourceUsage.Resource.Id, existingResourceUsage.Resource.Name, existingResourceUsage.Resource.Unit,
                existingResourceUsage.Resource.Color),
            existingResourceUsage.Date.ToDateTime()
        );
    }
}
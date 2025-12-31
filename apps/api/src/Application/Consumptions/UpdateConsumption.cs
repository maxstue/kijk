using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.ValueObjects;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions;

public record UpdateConsumptionRequest(string? Name, decimal? Value, CreateConsumptionValueTypes ValueType, Guid? ResourceId, DateTime? Date);

/// <summary>
/// Handler for updating consumption.
/// </summary>
public class UpdateConsumptionHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<UpdateConsumptionHandler> logger) : IHandler
{
    public async Task<Result<ConsumptionResponse>> UpdateAsync(Guid id, UpdateConsumptionRequest request, CancellationToken cancellationToken)
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
        var monthYear = MonthYear.ParseDateTime(request.Date ?? existingResourceUsage.Date.ToDateTime());
        existingResourceUsage.Name = request.Name ?? existingResourceUsage.Name;
        existingResourceUsage.Date = request.Date is not null ? monthYear : existingResourceUsage.Date;
        existingResourceUsage.ResourceId = request.ResourceId ?? existingResourceUsage.ResourceId;

        if (request.ValueType == CreateConsumptionValueTypes.Absolute)
        {
            existingResourceUsage.Value = request.Value ?? existingResourceUsage.Value;
        }
        else
        {
            var previousMonth = new DateTime(monthYear.Year, monthYear.Month - 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var currentMonth = previousMonth.AddMonths(1);

            var previousMonthConsumptionValue = await dbContext.Consumptions
                .Where(x => x.Date.Value >= previousMonth && x.Date.Value < currentMonth && x.ResourceId == request.ResourceId)
                .OrderByDescending(x => x.Date.Value)
                .Select(x => x.Value)
                .FirstOrDefaultAsync(cancellationToken);

            existingResourceUsage.Value = previousMonthConsumptionValue + request.Value ?? existingResourceUsage.Value;
        }

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
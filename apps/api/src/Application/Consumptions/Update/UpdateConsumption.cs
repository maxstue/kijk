using Kijk.Application.Abstractions.Persistence;
using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Update;

/// <summary>
/// Handler for updating consumption.
/// </summary>
public class UpdateConsumptionHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<UpdateConsumptionHandler> logger) : IHandler
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
        var monthYear = MonthYear.ParseDateTime(request.Date ?? existingResourceUsage.Date.ToDateTime());
        existingResourceUsage.Name = request.Name ?? existingResourceUsage.Name;
        existingResourceUsage.Date = request.Date is not null ? monthYear : existingResourceUsage.Date;
        var resourceId = request.ResourceId ?? existingResourceUsage.ResourceId;
        existingResourceUsage.ResourceId = resourceId;

        if (request.ValueType == UpdateConsumptionValueTypes.Absolute)
        {
            existingResourceUsage.Value = request.Value ?? existingResourceUsage.Value;
        }
        else
        {
            var currentMonth = new DateTime(monthYear.Year, monthYear.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var previousMonth = currentMonth.AddMonths(-1);

            var previousMonthConsumptionValue = await dbContext.Consumptions
                .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId
                            && x.Date.Value >= previousMonth
                            && x.Date.Value < currentMonth
                            && x.ResourceId == resourceId)
                .OrderByDescending(x => x.Date.Value)
                .Select(x => x.Value)
                .FirstOrDefaultAsync(cancellationToken);

            existingResourceUsage.Value = previousMonthConsumptionValue + request.Value ?? existingResourceUsage.Value;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return existingResourceUsage.ToResponse();
    }
}
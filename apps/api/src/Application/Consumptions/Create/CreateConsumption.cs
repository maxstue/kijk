using Kijk.Application.Abstractions.Persistence;
using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Create;

/// <summary>
/// Handler for creating a new consumption.
/// </summary>
public class CreateConsumptionHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateConsumptionHandler> logger) : IHandler
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

        // use a month range which is translatable by EF instead of accessing Date.Month/Year properties
        var monthStart = new DateTime(request.Date.Year, request.Date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonth = monthStart.AddMonths(1);

        var foundConsumption = await dbContext.Consumptions
            .Include(x => x.Resource)
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId
                        && x.Date.Value >= monthStart
                        && x.Date.Value < nextMonth
                        && x.ResourceId == request.ResourceId)
            .FirstOrDefaultAsync(cancellationToken);
        if (foundConsumption is not null)
        {
            logger.LogWarning("Consumption for '{ResourceName}' already exists for {Date:MMMM yyyy}", request.Name, request.Date);
            return Error.Conflict($"Consumption for '{foundConsumption.Resource.Name}' already exists for {request.Date:MMMM yyyy}");
        }

        var resource = await dbContext.Resources.FirstOrDefaultAsync(x => x.Id == request.ResourceId, cancellationToken);
        if (resource is null)
        {
            logger.LogWarning("Resource with id '{ResourceId}' not found", request.ResourceId);
            return Error.NotFound("Resource not found");
        }

        var consumption = await CreateConsumption(request, resource, household, cancellationToken);

        dbContext.Consumptions.Add(consumption);
        await dbContext.SaveChangesAsync(cancellationToken);

        return consumption.ToResponse();
    }

    // TODO valuetype should also be saved
    private async Task<Consumption> CreateConsumption(CreateConsumptionRequest request, Resource resource, Household household, CancellationToken cancellationToken)
    {
        var calculatedValue = request.Value;
        if (request.ValueType == CreateConsumptionValueTypes.Absolute)
        {
            return Consumption.Create(
                request.Name,
                resource,
                calculatedValue,
                household,
                request.Date
            );
        }

        var currentMonth = new DateTime(request.Date.Year, request.Date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var previousMonth = currentMonth.AddMonths(-1);

        var previousMonthConsumptionValue = await dbContext.Consumptions
            .Where(x => x.HouseholdId == currentUser.ActiveHouseholdId
                        && x.Date.Value >= previousMonth
                        && x.Date.Value < currentMonth
                        && x.ResourceId == request.ResourceId)
            .OrderByDescending(x => x.Date.Value)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(cancellationToken);

        calculatedValue = previousMonthConsumptionValue + request.Value;

        return Consumption.Create(
            request.Name,
            resource,
            calculatedValue,
            household,
            request.Date
        );
    }
}
using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.ValueObjects;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Consumptions;

public record UpdateConsumptionRequest(string? Name, decimal? Value, Guid? ResourceId, DateTime? Date);

/// <summary>
/// Handler for updating consumption.
/// </summary>
public static class UpdateConsumptionHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateConsumptionHandler));

    public static async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> HandleAsync(Guid id, UpdateConsumptionRequest command,
        AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .Include(x => x.Consumptions)
            .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

        if (household is null)
        {
            Logger.Error("Household with id '{Id}' was not found", currentUser.ActiveHouseholdId);
            return TypedResults.Problem(Error.NotFound($"Household for id '{currentUser.ActiveHouseholdId}' was not found").ToProblemDetails());
        }

        var existingResourceUsage = await dbContext.Consumptions
            .Include(resourceUsage => resourceUsage.Resource)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (existingResourceUsage is null)
        {
            Logger.Error("Resource consumption with id '{Id}' was not found", id);
            return TypedResults.Problem(Error.NotFound($"Resource consumption for id '{id}' was not found").ToProblemDetails());
        }

        existingResourceUsage.Name = command.Name ?? existingResourceUsage.Name;
        existingResourceUsage.Value = command.Value ?? existingResourceUsage.Value;
        existingResourceUsage.Date = command.Date is not null ? MonthYear.ParseDateTime(command.Date.Value) : existingResourceUsage.Date;
        existingResourceUsage.ResourceId = command.ResourceId ?? existingResourceUsage.ResourceId;


        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new ConsumptionResponse(
            existingResourceUsage.Id,
            existingResourceUsage.Name,
            existingResourceUsage.Description,
            existingResourceUsage.Value,
            new(existingResourceUsage.Resource.Id, existingResourceUsage.Resource.Name, existingResourceUsage.Resource.Unit,
                existingResourceUsage.Resource.Color),
            existingResourceUsage.Date.ToDateTime()
        ));
    }
}
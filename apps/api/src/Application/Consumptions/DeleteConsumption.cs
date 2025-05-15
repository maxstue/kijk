using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Consumptions;

/// <summary>
/// Handler for deleting a consumption.
/// </summary>
public static class DeleteConsumptionHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteConsumptionHandler));
    public static async Task<Results<Ok<bool>, ProblemHttpResult>> HandleAsync(Guid id, AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var foundEntity = await dbContext.Consumptions
            .FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (foundEntity == null)
        {
            Logger.Error("Consumption with id '{Id}' not found", id);
            return TypedResults.Problem(Error.NotFound($"Resource consumption with id '{id}' could not be found").ToProblemDetails());
        }

        dbContext.Consumptions.Remove(foundEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(true);
    }
}
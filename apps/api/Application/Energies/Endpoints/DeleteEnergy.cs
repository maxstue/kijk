using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Energies.Endpoints;

public static class DeleteEnergy
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteEnergy));

    public static async Task<Results<Ok<bool>, ProblemHttpResult>> HandleAsync(Guid id, AppDbContext dbContext, CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var foundEntity = await dbContext.Energy
            .FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (foundEntity == null)
        {
            Logger.Warning("Energy consumption with id {Id} could not be found", id);
            return TypedResults.Problem(Error.NotFound($"Energy consumption with id '{id}' could not be found").ToProblemDetails());
        }

        dbContext.Energy.Remove(foundEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(true);
    }
}
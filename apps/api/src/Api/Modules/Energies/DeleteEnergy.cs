using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Modules.Energies;

public static class DeleteEnergy
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteEnergy));

    public static RouteGroupBuilder MapDeleteEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapDelete("/{id:guid}", Handle);

        return groupBuilder;
    }

    private static async Task<Results<Ok<bool>, ProblemHttpResult>> Handle(Guid id, AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
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
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Energies;

public static class DeleteEnergy
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteEnergy));

    public static RouteGroupBuilder MapDeleteEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapDelete("/{id:guid}", Handle)
            .Produces<bool>()
            .Produces<List<Error>>(StatusCodes.Status400BadRequest)
            .Produces<List<Error>>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static async Task<IResult> Handle(Guid id, AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
        {
            var foundEntity = await dbContext.Energy
                .FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
            if (foundEntity == null)
            {
                Logger.Warning("Energy consumption with id {Id} could not be found", id);
                return TypedResults.NotFound($"Energy consumption with id '{id}' could not be found");
            }

            dbContext.Energy.Remove(foundEntity);
            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(true);
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(e.Message);
        }
    }
}
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Energies;

public record UpdateEnergyRequest(string? Name, decimal? Value, EnergyType? Type, DateTime? Date);

public record UpdateEnergyResponse(Guid Id, string Name, decimal Value, EnergyType Type, DateTime Date);

public static class UpdateEnergy
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateEnergy));

    public static RouteGroupBuilder MapUpdateEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPut("/{id:guid}", Handle)
            .Produces<UpdateEnergyResponse>()
            .Produces<List<Error>>(StatusCodes.Status404NotFound)
            .Produces<List<Error>>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    private static async Task<IResult> Handle(Guid id, UpdateEnergyRequest updateEnergyRequest, AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
        {
            var household = await dbContext.Households
                .Include(x => x.Energies)
                .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

            if (household is null)
            {
                return TypedResults.NotFound($"Household for id '{currentUser.ActiveHouseholdId}' was not found");
            }

            var existingEnergy = await dbContext.Energy.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (existingEnergy is null)
            {
                return TypedResults.NotFound($"Energy consumption for id '{id}' was not found");
            }

            existingEnergy.Name = updateEnergyRequest.Name ?? existingEnergy.Name;
            existingEnergy.Value = updateEnergyRequest.Value ?? existingEnergy.Value;
            existingEnergy.Type = updateEnergyRequest.Type ?? existingEnergy.Type;
            existingEnergy.Date = updateEnergyRequest.Date ?? existingEnergy.Date;

            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new UpdateEnergyResponse(
                existingEnergy.Id,
                existingEnergy.Name,
                existingEnergy.Value,
                existingEnergy.Type,
                existingEnergy.Date
            ));
        }
        catch (Exception e)
        {
            Logger.Error(e, "An error occurred while updating an energy consumption");
            return TypedResults.BadRequest(e.Message);
        }
    }
}
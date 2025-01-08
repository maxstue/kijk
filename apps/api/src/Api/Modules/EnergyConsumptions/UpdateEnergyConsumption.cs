using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.EnergyConsumptions;

public record UpdateEnergyConsumptionRequest(string? Name, decimal? Value, EnergyConsumptionType? Type, DateTime? Date);

public record UpdateEnergyConsumptionResponse(Guid Id, string Name, decimal Value, EnergyConsumptionType Type, DateTime Date);

public static class UpdateEnergyConsumption
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateEnergyConsumption));

    public static RouteGroupBuilder MapUpdateEnergyConsumption(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPut("/{id:guid}", Handle)
            .Produces<UpdateEnergyConsumptionResponse>()
            .Produces<List<Error>>(StatusCodes.Status404NotFound)
            .Produces<List<Error>>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    private static async Task<IResult> Handle(Guid id, UpdateEnergyConsumptionRequest updateEnergyConsumptionRequest, AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
        {
            var household = await dbContext.Households
                .Include(x => x.EnergyConsumptions)
                .FirstOrDefaultAsync(x => x.Id == currentUser.ActiveHouseholdId, cancellationToken);

            if (household is null)
            {
                return TypedResults.NotFound($"Household for id '{currentUser.ActiveHouseholdId}' was not found");
            }

            var existingEnergyConsumption = await dbContext.EnergyConsumptions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (existingEnergyConsumption is null)
            {
                return TypedResults.NotFound($"Energy consumption for id '{id}' was not found");
            }

            existingEnergyConsumption.Name = updateEnergyConsumptionRequest.Name ?? existingEnergyConsumption.Name;
            existingEnergyConsumption.Value = updateEnergyConsumptionRequest.Value ?? existingEnergyConsumption.Value;
            existingEnergyConsumption.Type = updateEnergyConsumptionRequest.Type ?? existingEnergyConsumption.Type;
            existingEnergyConsumption.Date = updateEnergyConsumptionRequest.Date ?? existingEnergyConsumption.Date;

            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new UpdateEnergyConsumptionResponse(
                existingEnergyConsumption.Id,
                existingEnergyConsumption.Name,
                existingEnergyConsumption.Value,
                existingEnergyConsumption.Type,
                existingEnergyConsumption.Date
            ));
        }
        catch (Exception e)
        {
            Logger.Error(e, "An error occurred while updating an energy consumption");
            return TypedResults.BadRequest(e.Message);
        }
    }
}
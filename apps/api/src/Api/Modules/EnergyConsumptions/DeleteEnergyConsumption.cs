using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.EnergyConsumptions;

public static class DeleteEnergyConsumption
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteEnergyConsumption));

    public static RouteGroupBuilder MapDeleteEnergyConsumption(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapDelete("/{id:guid}", Handle)
            .Produces<ApiResponse<bool>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static async Task<IResult> Handle(Guid id, AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
        {
            var foundEntity = await dbContext.EnergyConsumptions
                .FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
            if (foundEntity == null)
            {
                Logger.Warning("Energy consumption with id {Id} could not be found", id);
                return TypedResults.NotFound(ApiResponseBuilder.Error($"Energy consumption with id '{id}' could not be found"));
            }

            dbContext.EnergyConsumptions.Remove(foundEntity);
            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(ApiResponseBuilder.Success(true));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}
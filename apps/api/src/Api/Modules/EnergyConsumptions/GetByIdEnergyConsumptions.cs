using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.EnergyConsumptions;

public record GetByIdEnergyConsumptionResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Value,
    EnergyConsumptionType Type,
    DateTime CreatedAt);

public static class GetByIdEnergyConsumption
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetByIdEnergyConsumption));

    public static RouteGroupBuilder MapGetByIdEnergyConsumption(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/{id:guid}", Handle)
            .Produces<ApiResponse<GetByIdEnergyConsumptionResponse>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    /// <summary>
    /// Gets a <see cref="EnergyConsumption"/> by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(Guid id, AppDbContext dbContext, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await dbContext.EnergyConsumptions
                .Where(x => x.Id == id)
                .Select(
                    x => new GetByIdEnergyConsumptionResponse(
                        x.Id,
                        x.Name,
                        x.Description,
                        x.Value,
                        x.Type,
                        x.CreatedAt))
                .FirstOrDefaultAsync(cancellationToken);

            return entity is null
                ? TypedResults.NotFound(ApiResponseBuilder.Error($"Energy consumption for Id '{id}' was not found."))
                : TypedResults.Ok(ApiResponseBuilder.Success(entity));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}
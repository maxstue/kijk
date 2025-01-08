using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Energies;

public record GetByIdEnergyResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Value,
    EnergyType Type,
    DateTime CreatedAt);

public static class GetByIdEnergy
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetByIdEnergy));

    public static RouteGroupBuilder MapGetByIdEnergy(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/{id:guid}", Handle)
            .Produces<GetByIdEnergyResponse>()
            .Produces<List<Error>>(StatusCodes.Status400BadRequest)
            .Produces<List<Error>>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    /// <summary>
    /// Gets a <see cref="Energy"/> by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(Guid id, AppDbContext dbContext, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await dbContext.Energy
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new GetByIdEnergyResponse(
                    x.Id,
                    x.Name,
                    x.Description,
                    x.Value,
                    x.Type,
                    x.CreatedAt))
                .FirstOrDefaultAsync(cancellationToken);

            return entity is null ? TypedResults.NotFound($"Energy consumption for Id '{id}' was not found.") : TypedResults.Ok(entity);
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(e.Message);
        }
    }
}
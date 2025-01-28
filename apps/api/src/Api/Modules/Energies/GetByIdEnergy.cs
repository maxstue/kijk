using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

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
        groupBuilder.MapGet("/{id:guid}", Handle);
        return groupBuilder;
    }

    /// <summary>
    /// Gets a <see cref="Energy"/> by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<GetByIdEnergyResponse>, ProblemHttpResult>> Handle(Guid id, AppDbContext dbContext,
        CancellationToken cancellationToken)
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

            return entity is null
                ? TypedResults.Problem(Error.NotFound($"Energy consumption for Id '{id}' was not found.").ToProblemDetails())
                : TypedResults.Ok(entity);
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.Problem(Error.Unexpected(description: e.Message).ToProblemDetails());
        }
    }
}
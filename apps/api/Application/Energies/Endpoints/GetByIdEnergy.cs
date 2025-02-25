using Kijk.Application.Energies.Models;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Energies.Endpoints;

public static class GetByIdEnergy
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetByIdEnergy));

    /// <summary>
    /// Gets a <see cref="Energy"/> by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<GetByIdEnergyResponse>, ProblemHttpResult>> HandleAsync(Guid id, AppDbContext dbContext,
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
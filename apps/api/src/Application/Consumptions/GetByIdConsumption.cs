using Kijk.Application.Consumptions.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Consumptions;

/// <summary>
/// Handler for getting consumption by id.
/// </summary>
public static class GetByIdConsumptionHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetByIdConsumptionHandler));

    public static async Task<Results<Ok<ConsumptionResponse>, ProblemHttpResult>> HandleAsync(Guid id, AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.Consumptions
            .AsNoTracking()
            .Include(x => x.Resource)
            .Where(x => x.Id == id)
            .Select(x => new ConsumptionResponse(
                x.Id,
                x.Name,
                x.Description,
                x.Value,
                new(x.Resource.Id, x.Resource.Name, x.Resource.Unit, x.Resource.Color),
                x.Date.ToDateTime()))
            .FirstOrDefaultAsync(cancellationToken);

        if (entity is null)
        {
            Logger.Error("Consumption with id {Id} not found", id);
            return TypedResults.Problem(Error.NotFound($"Resource consumption for Id '{id}' was not found.").ToProblemDetails());
        }

        return TypedResults.Ok(entity);
    }
}
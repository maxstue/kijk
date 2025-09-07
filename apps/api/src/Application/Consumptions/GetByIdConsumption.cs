using Kijk.Application.Consumptions.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions;

/// <summary>
/// Handler for getting consumption by id.
/// </summary>
public class GetByIdConsumptionHandler(AppDbContext dbContext, ILogger<GetByIdConsumptionHandler> logger) : IHandler
{
    public async Task<Result<ConsumptionResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
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
            logger.LogError("Consumption with id {Id} not found", id);
            return Error.NotFound($"Resource consumption for Id '{id}' was not found.");
        }

        return entity;
    }
}
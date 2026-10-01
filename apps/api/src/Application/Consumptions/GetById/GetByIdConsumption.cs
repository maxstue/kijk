using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.GetById;

/// <summary>
/// Handler for getting consumption by id.
/// </summary>
public class GetByIdConsumptionHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<GetByIdConsumptionHandler> logger) : IHandler
{
    /// <summary>Gets a consumption of the active household.</summary>
    /// <param name="id">The consumption id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The consumption, or a not-found error.</returns>
    public async Task<Result<ConsumptionResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await dbContext.Consumptions
            .AsNoTracking()
            .Where(x => x.Id == id && x.HouseholdId == currentUser.ActiveHouseholdId)
            .ToResponse()
            .FirstOrDefaultAsync(cancellationToken);

        if (entity is null)
        {
            logger.LogWarning("Consumption with id '{Id}' not found", id);
            return Error.NotFound("Consumption not found.");
        }

        return entity;
    }
}
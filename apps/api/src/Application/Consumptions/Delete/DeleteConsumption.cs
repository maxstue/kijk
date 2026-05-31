using Kijk.Application.Abstractions.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions.Delete;

/// <summary>
/// Handler for deleting a consumption.
/// </summary>
public class DeleteConsumptionHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<DeleteConsumptionHandler> logger) : IHandler
{
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var foundEntity = await dbContext.Consumptions
            .FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (foundEntity == null)
        {
            logger.LogWarning("Consumption with id '{Id}' not found", id);
            return Error.NotFound("Consumption not found");
        }

        dbContext.Consumptions.Remove(foundEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
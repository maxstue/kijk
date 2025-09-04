using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Consumptions;

/// <summary>
/// Handler for deleting a consumption.
/// </summary>
public class DeleteConsumptionHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<DeleteConsumptionHandler> logger)
{
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var foundEntity = await dbContext.Consumptions
            .FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (foundEntity == null)
        {
            logger.LogError("Consumption with id '{Id}' not found", id);
            return Error.NotFound($"Resource consumption with id '{id}' could not be found");
        }

        dbContext.Consumptions.Remove(foundEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
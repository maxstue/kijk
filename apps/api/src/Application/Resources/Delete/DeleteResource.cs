using Kijk.Application.Resources.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources.Delete;

/// <summary>
/// Handler for the delete a resource.
/// </summary>
public class DeleteResourceHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<DeleteResourceHandler> logger) : IHandler
{
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var resourceResult = await ResourceHelpers.GetModifiableResourceAsync(dbContext, currentUser, id, cancellationToken);
        if (resourceResult.IsError)
        {
            logger.LogWarning("User '{UserId}' could not manage resource '{ResourceId}': {Reason}", currentUser.Id, id, resourceResult.Error.Description);
            return resourceResult.Error;
        }

        var resource = resourceResult.Value;

        var consumptionCount = await dbContext.Consumptions
            .CountAsync(consumption => consumption.ResourceId == id, cancellationToken);
        var consumptionLimitCount = await dbContext.ConsumptionsLimits
            .CountAsync(limit => limit.ResourceId == id, cancellationToken);
        if (consumptionCount > 0 || consumptionLimitCount > 0)
        {
            logger.LogWarning(
                "Resource '{ResourceId}' cannot be deleted because it is used by {ConsumptionCount} consumptions and {ConsumptionLimitCount} consumption limits",
                id,
                consumptionCount,
                consumptionLimitCount);
            return Error.Conflict(
                $"Resource cannot be deleted because it is used by {consumptionCount} consumption(s) and {consumptionLimitCount} consumption limit(s)");
        }

        dbContext.Resources.Remove(resource);

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
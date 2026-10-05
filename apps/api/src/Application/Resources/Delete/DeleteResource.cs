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
    /// <summary>Deletes an unused custom resource of the active space.</summary>
    /// <param name="id">The resource id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found/conflict error.</returns>
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
        var limitCount = await dbContext.Limits
            .CountAsync(limit => limit.ResourceId == id, cancellationToken);
        if (consumptionCount > 0 || limitCount > 0)
        {
            logger.LogWarning(
                "Resource '{ResourceId}' cannot be deleted because it is used by {ConsumptionCount} consumptions and {LimitCount} consumption limits",
                id,
                consumptionCount,
                limitCount);
            return Error.Conflict(
                $"Resource cannot be deleted because it is used by {consumptionCount} consumption(s) and {limitCount} consumption limit(s)");
        }

        dbContext.Resources.Remove(resource);

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
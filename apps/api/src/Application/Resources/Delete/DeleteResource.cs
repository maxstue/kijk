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
        if (!await dbContext.IsActiveHouseholdAdminAsync(currentUser, cancellationToken))
        {
            logger.LogWarning("User with id '{UserId}' is not allowed to manage resources in household '{HouseholdId}'",
                currentUser.Id, currentUser.ActiveHouseholdId);
            return Error.Authorization("Only the active household administrator can manage resources");
        }

        var resource = await dbContext
            .AvailableResources(currentUser)
            .FirstOrDefaultAsync(resource => resource.Id == id, cancellationToken);
        if (resource is null)
        {
            logger.LogWarning("Resource with id '{ResourceId}' was not available to user '{UserId}'", id, currentUser.Id);
            return Error.NotFound("Resource could not be found");
        }

        if (resource.CreatorType == CreatorType.System)
        {
            logger.LogWarning("User with id '{UserId}' attempted to delete system resource '{ResourceId}'", currentUser.Id, id);
            return Error.Authorization("System resources cannot be deleted");
        }

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
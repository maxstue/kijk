using Kijk.Application.Resources.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources.Update;

/// <summary>
/// Handler for updating a resource.
/// </summary>
public class UpdateResourceHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<UpdateResourceHandler> logger) : IHandler
{
    public async Task<Result<ResourceResponse>> UpdateAsync(Guid id, UpdateResourceRequest request, CancellationToken cancellationToken)
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
            return Error.NotFound("Resource not found");
        }

        if (resource.CreatorType == CreatorType.System)
        {
            logger.LogWarning("User with id '{UserId}' attempted to update system resource '{ResourceId}'", currentUser.Id, id);
            return Error.Authorization("System resources cannot be updated");
        }

        var name = request.Name?.Trim() ?? resource.Name;
        var unit = request.Unit?.Trim() ?? resource.Unit;
        if (await dbContext.HasResourceConflictAsync(currentUser, name, unit, id, cancellationToken))
        {
            logger.LogWarning("Resource with name '{Name}' and unit '{Unit}' already exists", name, unit);
            return Error.Conflict($"A resource with the name '{name}' and unit '{unit}' already exists");
        }

        resource.Name = name;
        resource.Color = request.Color ?? resource.Color;
        resource.Unit = unit;

        await dbContext.SaveChangesAsync(cancellationToken);

        return resource.ToResponse();
    }
}
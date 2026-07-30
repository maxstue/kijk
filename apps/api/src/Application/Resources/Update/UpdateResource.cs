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
        var resourceResult = await ResourceHelpers.GetModifiableResourceAsync(dbContext, currentUser, id, cancellationToken);
        if (resourceResult.IsError)
        {
            logger.LogWarning(
                "User '{UserId}' could not manage resource '{ResourceId}': {Reason}",
                currentUser.Id,
                id,
                resourceResult.Error.Description);
            return resourceResult.Error;
        }

        var resource = resourceResult.Value;

        var name = request.Name?.Trim() ?? resource.Name;
        var unit = request.Unit?.Trim() ?? resource.Unit;
        if (await ResourceHelpers.HasConflictAsync(dbContext, currentUser, name, unit, id, cancellationToken))
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
using Kijk.Application.Resources.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources;

public record UpdateResourceRequest(string? Name, string? Color, string? Unit);

/// <summary>
/// Handler for updating a resource.
/// </summary>
public class UpdateResourceHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<UpdateResourceHandler> logger) : IHandler
{
    public async Task<Result<ResourceResponse>> UpdateAsync(Guid id, UpdateResourceRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Resources)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            logger.LogWarning("User with id '{Id}' could not be found", currentUser.Id);
            return Error.NotFound("User was not found");
        }

        var resource = await dbContext.Resources.FindAsync([id], cancellationToken);
        if (resource is null)
        {
            logger.LogWarning("Resource with id '{Id}' could not be found", id);
            return Error.NotFound("Resource not found");
        }

        resource.Name = request.Name ?? resource.Name;
        resource.Color = request.Color ?? resource.Color;
        resource.Unit = request.Unit ?? resource.Unit;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ResourceResponse(
            resource.Id,
            resource.Name,
            resource.Color,
            resource.Unit,
            resource.CreatorType
        );
    }
}
using Kijk.Application.Abstractions.Persistence;
using Kijk.Application.Resources.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources.Create;

/// <summary>
/// Handler to create a new resource.
/// </summary>
public class CreateResourceHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateResourceHandler> logger) : IHandler
{
    public async Task<Result<ResourceResponse>> CreateAsync(CreateResourceRequest command, CancellationToken cancellationToken)
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

        if (user.Resources.Any(c => string.Equals(c.Name, command.Name, StringComparison.OrdinalIgnoreCase)))
        {
            logger.LogWarning("Resource with name '{Name}' already exists", command.Name);
            return Error.Conflict($"A resource with the name '{command.Name}' already exists");
        }

        var newResource = new Resource
        {
            Name = command.Name,
            Unit = command.Unit,
            Color = command.Color,
            CreatorType = CreatorType.User
        };

        user.AddResource(newResource);

        var resEntity = await dbContext.Resources.AddAsync(newResource, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ResourceResponse(resEntity.Entity.Id, resEntity.Entity.Name, resEntity.Entity.Color, resEntity.Entity.Unit,
            resEntity.Entity.CreatorType);
    }
}
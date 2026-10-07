using Kijk.Application.Resources.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Units.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources.Create;

/// <summary>
/// Handler to create a new resource.
/// </summary>
public class CreateResourceHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateResourceHandler> logger) : IHandler
{
    /// <summary>Creates a custom resource in the active space.</summary>
    /// <param name="request">The resource data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created resource, or a conflict if it already exists.</returns>
    public async Task<Result<ResourceResponse>> CreateAsync(CreateResourceRequest request, CancellationToken cancellationToken)
    {
        var space = await dbContext.Spaces
            .FirstOrDefaultAsync(space => space.Id == currentUser.ActiveSpaceId, cancellationToken);
        if (space is null)
        {
            logger.LogWarning("Active space with id '{SpaceId}' was not found", currentUser.ActiveSpaceId);
            return Error.NotFound("Active space was not found");
        }

        var name = request.Name.Trim();
        var unit = await dbContext.GetAvailableUnits(currentUser)
            .FirstOrDefaultAsync(item => item.Id == request.UnitId, cancellationToken);
        if (unit is null)
        {
            return Error.NotFound("Unit is not available in the active space");
        }

        if (await ResourceHelpers.HasConflictAsync(dbContext, currentUser, name, unit.Id, null, cancellationToken))
        {
            logger.LogWarning("Resource with name '{Name}' and unit '{UnitId}' already exists", name, unit.Id);
            return Error.Conflict($"A resource with the name '{name}' and unit '{unit.Name}' already exists");
        }

        var newResource = new Resource
        {
            Name = name,
            Unit = unit,
            Color = request.Color,
            Icon = request.Icon,
            CreatorType = CreatorType.User,
            Space = space
        };

        var resEntity = await dbContext.Resources.AddAsync(newResource, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return resEntity.Entity.ToResponse();
    }
}
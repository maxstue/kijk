using Kijk.Application.Resources.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources.GetAll;

/// <summary>
/// Handler for getting all resources.
/// </summary>
public class GetAllResourcesHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<GetAllResourcesHandler> logger) : IHandler
{
    public async Task<Result<List<ResourceResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var resources = await dbContext
            .GetUserAvailableResources(currentUser)
            .AsNoTracking()
            .OrderBy(resource => resource.Name)
            .ToResponse()
            .ToListAsync(cancellationToken);

        if (!await dbContext.Users.AnyAsync(user => user.Id == currentUser.Id, cancellationToken))
        {
            logger.LogWarning("User with id '{UserId}' was not found", currentUser.Id);
            return Error.NotFound("User was not found");
        }

        return resources;
    }
}
using Kijk.Application.Abstractions.Persistence;
using Kijk.Application.Resources.Shared;
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
        var user = await dbContext.Users
            .Include(x => x.Resources)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            logger.LogWarning("User with id '{UserId}' was not found", currentUser.Id);
            return Error.NotFound("User was not found");
        }

        var resources = user.Resources
            .Select(x => new ResourceResponse(x.Id, x.Name, x.Color, x.Unit, x.CreatorType))
            .ToList();

        return resources;
    }
}
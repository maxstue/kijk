using Kijk.Application.Resources.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources;

/// <summary>
/// Handler for getting all resources.
/// </summary>
public class GetAllResourcesHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<GetAllResourcesHandler> logger) : IHandler
{
    public async Task<Result<List<ResourceResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Resources)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            logger.LogError("User with id '{UserId}' was not found", currentUser.Id);
            return Error.NotFound($"User with id '{currentUser.Id}' was not found");
        }

        var resources = user.Resources
            .Select(x => new ResourceResponse(x.Id, x.Name, x.Color, x.Unit, x.CreatorType))
            .ToList();

        return resources;
    }
}
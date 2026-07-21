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
        var resources = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .SelectMany(x => x.Resources)
            .AsNoTracking()
            .ToResponse()
            .ToListAsync(cancellationToken);

        if (resources.Count == 0 && !await dbContext.Users.AnyAsync(x => x.Id == currentUser.Id, cancellationToken))
        {
            logger.LogWarning("User with id '{UserId}' was not found", currentUser.Id);
            return Error.NotFound("User was not found");
        }

        return resources;
    }
}
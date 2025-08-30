using Kijk.Application.Resources.Shared;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources;

/// <summary>
/// Handler for getting a resource by id.
/// </summary>
/// <param name="dbContext"></param>
/// <param name="currentUser"></param>
/// <param name="logger"></param>
public class GetByIdResourceHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<GetByIdResourceHandler> logger)
{
    /// <summary>
    /// Handle to get a resource type by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<Result<ResourceResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
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

        var resource = user.Resources
            .Where(x => x.Id == id)
            .Select(x => new ResourceResponse(x.Id, x.Name, x.Color, x.Unit, x.CreatorType))
            .FirstOrDefault();

        if (resource is null)
        {
            return Error.NotFound($"Resource with id '{id}' was not found");
        }

        return resource;
    }
}
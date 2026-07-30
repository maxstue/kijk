using Kijk.Application.Resources.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources.GetById;

/// <summary>
/// Handler for getting a resource by id.
/// </summary>
/// <param name="dbContext"></param>
/// <param name="currentUser"></param>
/// <param name="logger"></param>
public class GetByIdResourceHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<GetByIdResourceHandler> logger) : IHandler
{
    /// <summary>
    /// Handle to get a resource type by id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<Result<ResourceResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var resource = await dbContext
            .GetUserAvailableResources(currentUser)
            .Where(resource => resource.Id == id)
            .AsNoTracking()
            .ToResponse()
            .FirstOrDefaultAsync(cancellationToken);

        if (resource is null)
        {
            logger.LogWarning("Resource with id '{ResourceId}' was not available to user '{UserId}'", id, currentUser.Id);
            return Error.NotFound($"Resource with id '{id}' was not found");
        }

        return resource;
    }
}
using Kijk.Application.Abstractions.Persistence;
using Kijk.Application.Resources.Shared;
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
        var resource = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .SelectMany(x => x.Resources)
            .Where(x => x.Id == id)
            .AsNoTracking()
            .ProjectToResponse()
            .FirstOrDefaultAsync(cancellationToken);

        if (resource is null)
        {
            if (!await dbContext.Users.AnyAsync(x => x.Id == currentUser.Id, cancellationToken))
            {
                logger.LogWarning("User with id '{UserId}' was not found", currentUser.Id);
                return Error.NotFound("User was not found");
            }

            return Error.NotFound($"Resource with id '{id}' was not found");
        }

        return resource;
    }
}
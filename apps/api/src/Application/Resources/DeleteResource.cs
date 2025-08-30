using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources;

/// <summary>
/// Handler for the delete a resource.
/// </summary>
public class DeleteResourceHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<DeleteResourceHandler> logger)
{
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Resources)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            logger.LogError("User with id {Id} could not be found", currentUser.Id);
            return Error.NotFound($"User with id '{currentUser.Id}' was not found");
        }

        if (user.Resources.ToList().Find(x => x.Id == id) is null)
        {
            logger.LogError("User with id '{UserId}' was not allowed to delete the resource type with id {CategoryId}", currentUser.Id, id);
            return Error.Validation($"‘User‘ with id '{currentUser.Id}' is not allowed to delete the resource type");
        }

        var foundResource = await dbContext.Resources.FindAsync([id],cancellationToken);
        if (foundResource is null)
        {
            logger.LogError("Resource with id {Id} could not be found", id);
            return Error.NotFound($"Resource with id '{id}' could not be found");
        }

        if (foundResource.CreatorType == CreatorType.System)
        {
            logger.LogError("Resource with id {Id} could not be deleted, because it is of creator type 'Default'", id);
            return Error.Validation($"Resource with id '{id}' could not be deleted, because it is of creator type 'Default'");
        }

        user.DeleteResource(foundResource.Id);
        dbContext.Resources.Remove(foundResource);

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
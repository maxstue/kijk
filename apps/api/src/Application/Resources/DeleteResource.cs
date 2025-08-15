using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Resources;

/// <summary>
/// Handler for the delete a resource.
/// </summary>
public static class DeleteResourceHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteResourceHandler));

    public static async Task<Results<Ok<bool>, ProblemHttpResult>> HandleAsync(Guid id, AppDbContext dbContext, CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Resources)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            Logger.Error("User with id {Id} could not be found", currentUser.Id);
            return TypedResults.Problem(Error.NotFound($"User with id '{currentUser.Id}' was not found").ToProblemDetails());
        }

        if (user.Resources.ToList().Find(x => x.Id == id) is null)
        {
            Logger.Error("User with id '{UserId}' was not allowed to delete the resource type with id {CategoryId}", currentUser.Id, id);
            return TypedResults.Problem(Error.Validation($"‘User‘ with id '{currentUser.Id}' is not allowed to delete the resource type")
                .ToProblemDetails());
        }

        var foundResource = await dbContext.Resources.FindAsync([id], cancellationToken);
        if (foundResource is null)
        {
            Logger.Error("Resource with id {Id} could not be found", id);
            return TypedResults.Problem(Error.NotFound($"Resource with id '{id}' could not be found").ToProblemDetails());
        }

        if (foundResource.CreatorType == CreatorType.System)
        {
            Logger.Error("Resource with id {Id} could not be deleted, because it is of creator type 'Default'", id);
            return TypedResults.Problem(Error
                .Validation($"Resource with id '{id}' could not be deleted, because it is of creator type 'Default'").ToProblemDetails());
        }

        user.DeleteResource(foundResource.Id);
        dbContext.Resources.Remove(foundResource);

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(true);
    }
}
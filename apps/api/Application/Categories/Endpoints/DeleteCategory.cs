using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Categories.Endpoints;

public static class DeleteCategory
{
    private static readonly ILogger Logger = Log.ForContext(typeof(DeleteCategory));

    /// <summary>
    /// Deletes a category by its id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<bool>, ProblemHttpResult>> HandleAsync(Guid id, AppDbContext dbContext, CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Categories)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            Logger.Warning("User with id {Id} could not be found", currentUser.Id);
            return TypedResults.Problem(Error.NotFound($"User with id '{currentUser.Id}' was not found").ToProblemDetails());
        }

        if (user.Categories.Find(x => x.Id == id) is null)
        {
            Logger.Warning("User with id '{UserId}' was not allowed to delete the category with id {CategoryId}", currentUser.Id, id);
            return TypedResults.Problem(Error.Validation($"‘User‘ with id '{currentUser.Id}' is not allowed to delete the category")
                .ToProblemDetails());
        }

        var foundEntity = await dbContext.Categories.FindAsync(new object[] { id }, cancellationToken);
        if (foundEntity is null)
        {
            Logger.Warning("Category with id {Id} could not be found", id);
            return TypedResults.Problem(Error.NotFound($"Category with id '{id}' could not be found").ToProblemDetails());
        }

        if (foundEntity.CreatorType == CategoryCreatorType.Default)
        {
            Logger.Warning("Category with id {Id} could not be deleted, because it is of creator type 'Default'", id);
            return TypedResults.Problem(Error
                .Validation($"Category with id '{id}' could not be deleted, because it is of creator type 'Default'").ToProblemDetails());
        }

        dbContext.Categories.Remove(foundEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(true);
    }
}
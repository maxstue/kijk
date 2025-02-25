using Kijk.Application.Categories.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Categories.Endpoints;

public static class UpdateCategory
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateCategory));

    /// <summary>
    /// Updates a category by its id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="updateCategoryRequest"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<CategoryResponse>, ProblemHttpResult>> HandleAsync(
        Guid id,
        UpdateCategoryRequest updateCategoryRequest,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<CategoryType>(updateCategoryRequest.Type, true, out var categoryType))
        {
            return TypedResults.Problem(Error.Validation("Invalid category type").ToProblemDetails());
        }

        var user = await dbContext.Users
            .Include(x => x.Categories)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            Logger.Warning("User with id {Id} could not be found", currentUser.Id);
            return TypedResults.Problem(Error.NotFound($"User with id '{currentUser.Id}' was not found").ToProblemDetails());
        }

        var category = await dbContext.Categories.FindAsync([id], cancellationToken);

        if (category is null)
        {
            return TypedResults.Problem(Error.NotFound($"Category with id {id} was not found").ToProblemDetails());
        }

        category.Name = updateCategoryRequest.Name ?? category.Name;
        category.Color = updateCategoryRequest.Color ?? category.Color;
        category.Type = categoryType;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(CategoryResponse.Create(category));
    }
}
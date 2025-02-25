using Kijk.Application.Categories.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Categories.Endpoints;

public static class GetAllCategories
{
    /// <summary>
    /// Retrieves all categories for the current user.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task<Results<Ok<Dictionary<CategoryType, List<CategoryResponse>>>, ProblemHttpResult>> HandleAsync(AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Categories)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            return TypedResults.Problem(Error.NotFound($"User with id '{currentUser.Id}' was not found").ToProblemDetails());
        }

        var categories = user.Categories
            .Select(CategoryResponse.Create)
            .GroupBy(x => x.Type)
            .Select(x => new { Type = x.Key, Categories = x.ToList() })
            .ToDictionary(x => x.Type, x => x.Categories);

        return TypedResults.Ok(categories);
    }
}
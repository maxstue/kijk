using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Categories;

public static class GetAllCategories
{
    public static RouteGroupBuilder MapGetAllCategories(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("", Handle);

        return groupBuilder;
    }

    /// <summary>
    /// Retrieves all categories for the current user.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<Dictionary<CategoryType, List<CategoryDto>>>, ProblemHttpResult>> Handle(AppDbContext dbContext,
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
            .Select(CategoryDto.Create)
            .GroupBy(x => x.Type)
            .Select(x => new { Type = x.Key, Categories = x.ToList() })
            .ToDictionary(x => x.Type, x => x.Categories);

        return TypedResults.Ok(categories);
    }
}
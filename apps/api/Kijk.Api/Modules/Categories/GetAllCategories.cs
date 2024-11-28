using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Categories;

public static class GetAllCategories
{
    private static readonly ILogger Logger = Log.ForContext(typeof(GetAllCategories));

    public static RouteGroupBuilder MapGetAllCategories(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("", Handle)
            .Produces<ApiResponse<Dictionary<CategoryType, List<CategoryDto>>>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    /// <summary>
    ///     Retrieves all categories for the current user.
    /// </summary>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
        {
            var user = await dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return TypedResults.NotFound(ApiResponseBuilder.Error($"User with id '{currentUser.Id}' was not found"));
            }

            var categories = user.Categories
                .Select(CategoryDto.Create)
                .GroupBy(x => x.Type)
                .Select(x => new { Type = x.Key, Categories = x.ToList() })
                .ToDictionary(x => x.Type, x => x.Categories);

            return TypedResults.Ok(ApiResponseBuilder.Success(categories));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}
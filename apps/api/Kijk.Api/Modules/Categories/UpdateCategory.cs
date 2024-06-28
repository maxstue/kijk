using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Categories;

public record UpdateCategoryRequest(string? Name, string? Color, string Type);

public static class UpdateCategory
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateCategory));

    public static RouteGroupBuilder MapUpdateCategory(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPut("/{id:guid}", Handle)
            .Produces<ApiResponse<CategoryDto>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status409Conflict)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    /// <summary>
    ///     Updates a category by its id.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="updateCategoryRequest"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(
        Guid id,
        UpdateCategoryRequest updateCategoryRequest,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        try
        {
            if (!Enum.TryParse<CategoryType>(updateCategoryRequest.Type, true, out var categoryType))
            {
                return TypedResults.BadRequest(ApiResponseBuilder.Error("Invalid category type"));
            }

            var user = await dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                Logger.Warning("User with id {Id} could not be found", currentUser.Id);
                return TypedResults.NotFound(ApiResponseBuilder.Error($"User with id '{currentUser.Id}' was not found"));
            }

            var category = await dbContext.Categories.FindAsync(new object?[] { id }, cancellationToken);

            if (category is null)
            {
                return TypedResults.NotFound(ApiResponseBuilder.Error($"Category with id {id} was not found"));
            }

            category.Name = updateCategoryRequest.Name ?? category.Name;
            category.Color = updateCategoryRequest.Color ?? category.Color;
            category.Type = categoryType;

            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(ApiResponseBuilder.Success(CategoryDto.Create(category)));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}

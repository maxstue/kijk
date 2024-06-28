using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Categories;

public record CreateCategoryRequest(string Name, string Color, string Type);

public class CreateCategoryValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(4, 30).WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Name‘ must be between 4 and 30 characters long");

        RuleFor(x => x.Color)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Color' must be set")
            .Must(x => x.StartsWith("#")).WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Color' must start with a '#'");
    }
}

public static class CreateCategory
{
    private static readonly ILogger Logger = Log.ForContext(typeof(CreateCategory));

    public static RouteGroupBuilder MapCreateCategory(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPost("/", Handle)
            .WithRequestValidation<CreateCategoryRequest>()
            .Produces<ApiResponse<CategoryDto>>()
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status409Conflict)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<List<AppError>>>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    /// <summary>
    ///     Retrieves a single category by its id.
    /// </summary>
    /// <param name="createCategoryRequest"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<IResult> Handle(
        CreateCategoryRequest createCategoryRequest,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        try
        {
            if (!Enum.TryParse<CategoryType>(createCategoryRequest.Type, true, out var categoryType))
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

            if (user.Categories.Any(c => string.Equals(c.Name, createCategoryRequest.Name, StringComparison.CurrentCultureIgnoreCase)))
            {
                return TypedResults.Conflict(ApiResponseBuilder.Error($"A category with the name '{createCategoryRequest.Name}' already exists"));
            }

            var newCategory = Category.Create(createCategoryRequest.Name, createCategoryRequest.Color, CategoryCreatorType.User, categoryType, user);
            var resEntity = await dbContext.AddAsync(newCategory, cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(ApiResponseBuilder.Success(CategoryDto.Create(resEntity.Entity)));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}

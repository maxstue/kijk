using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Categories;

public record CreateCategoryRequest(string Name, string Color, string Type);

public class CreateCategoryValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(4, 30).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be between 4 and 30 characters long");

        RuleFor(x => x.Color)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Color' must be set")
            .Must(x => x.StartsWith('#')).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Color' must start with a '#'");
    }
}

public static class CreateCategory
{
    private static readonly ILogger Logger = Log.ForContext(typeof(CreateCategory));

    public static RouteGroupBuilder MapCreateCategory(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPost("/", Handle);

        return groupBuilder;
    }

    /// <summary>
    /// Retrieves a single category by its id.
    /// </summary>
    /// <param name="createCategoryRequest"></param>
    /// <param name="validator"></param>
    /// <param name="dbContext"></param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<CategoryDto>, ProblemHttpResult>> Handle(CreateCategoryRequest createCategoryRequest,
        IValidator<CreateCategoryRequest> validator,
        AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(createCategoryRequest, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .Select(x => Error.Validation(description: $"{x.ErrorCode} - {x.ErrorMessage}"))
                .ToList();
            return TypedResults.Problem(Error.Validation(errors[0].Description).ToProblemDetails());
        }

        if (!Enum.TryParse<CategoryType>(createCategoryRequest.Type, true, out var categoryType))
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

        if (user.Categories.Any(c => string.Equals(c.Name, createCategoryRequest.Name, StringComparison.OrdinalIgnoreCase)))
        {
            return TypedResults.Problem(
                Error.Validation($"A category with the name '{createCategoryRequest.Name}' already exists").ToProblemDetails());
        }

        var newCategory = Category.Create(createCategoryRequest.Name, createCategoryRequest.Color, CategoryCreatorType.User, categoryType, user);
        var resEntity = await dbContext.AddAsync(newCategory, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(CategoryDto.Create(resEntity.Entity));
    }
}
namespace Kijk.Api.Application.Categories;

public class CreateCategoryValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(CategoriesErrors.Codes.PostValidationError).WithMessage("'Name‘ must be set")
            .Length(4, 30).WithErrorCode(CategoriesErrors.Codes.PostValidationError).WithMessage("'Name‘ must be between 4 and 30 characters long");
        
        RuleFor(x => x.Color)
            .NotEmpty().WithErrorCode(CategoriesErrors.Codes.PostValidationError).WithMessage("'Color' must be set")
            .Must(x => x.StartsWith("#")).WithErrorCode(CategoriesErrors.Codes.PostValidationError).WithMessage("'Color' must start with a '#'");
    }
}

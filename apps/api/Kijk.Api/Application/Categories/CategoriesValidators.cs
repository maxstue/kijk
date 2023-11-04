using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Categories;

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

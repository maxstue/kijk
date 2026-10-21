using Kijk.Application.Categories.Shared;
using Kijk.Shared;

namespace Kijk.Application.Categories.Update;

/// <summary>
/// Validates requests for updating categories.
/// </summary>
public sealed class UpdateCategoryValidator : AbstractValidator<UpdateCategoryRequest>
{
    /// <summary>Creates the validator rules for category updates.</summary>
    public UpdateCategoryValidator()
    {
        RuleFor(request => request.Name)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name' must be set")
            .Length(CategoryValidationRules.NameMinimumLength, CategoryValidationRules.NameMaximumLength).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Icon)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError)
            .MaximumLength(CategoryValidationRules.IconMaximumLength).WithErrorCode(ErrorCodes.ValidationError)
            .Matches(CategoryValidationRules.IconPattern).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Icon' must be a valid icon name");
        RuleFor(request => request.Color)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError)
            .Matches(CategoryValidationRules.HexColorPattern).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Color' must be a valid six-digit hex color");
        RuleFor(request => request.Kind)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
    }
}
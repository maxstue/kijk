using Kijk.Application.Resources.Shared;
using Kijk.Shared;

namespace Kijk.Application.Resources.Create;

public class CreateResourceRequestValidator : AbstractValidator<CreateResourceRequest>
{
    public CreateResourceRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name' must not be whitespace")
            .Length(ResourceValidationRules.NameMinimumLength, ResourceValidationRules.NameMaximumLength)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage($"'Name' must be between {ResourceValidationRules.NameMinimumLength} and {ResourceValidationRules.NameMaximumLength} characters long");

        RuleFor(x => x.Color)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Color' must be set")
            .Matches(ResourceValidationRules.HexColorPattern)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("'Color' must be a valid six-digit hex color");

        RuleFor(x => x.Icon)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Icon' must be set")
            .MaximumLength(ResourceValidationRules.IconMaximumLength)
            .Matches(ResourceValidationRules.IconPattern)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("'Icon' must be a valid icon name");

        RuleFor(x => x.UnitId)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'UnitId' must be set");
    }
}
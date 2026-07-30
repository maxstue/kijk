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

        RuleFor(x => x.Unit)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Unit' must be set")
            .Must(unit => !string.IsNullOrWhiteSpace(unit)).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Unit' must not be whitespace")
            .Length(ResourceValidationRules.UnitMinimumLength, ResourceValidationRules.UnitMaximumLength)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage($"'Unit' must be between {ResourceValidationRules.UnitMinimumLength} and {ResourceValidationRules.UnitMaximumLength} characters long");
    }
}
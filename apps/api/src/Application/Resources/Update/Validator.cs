using Kijk.Application.Resources.Shared;
using Kijk.Shared;

namespace Kijk.Application.Resources.Update;

/// <summary>
/// Validates requests that update a custom resource.
/// </summary>
public sealed class UpdateResourceRequestValidator : AbstractValidator<UpdateResourceRequest>
{
    public UpdateResourceRequestValidator()
    {
        RuleFor(request => request)
            .Must(request => request.Name is not null || request.Color is not null || request.Unit is not null)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("At least one resource property must be set");

        RuleFor(request => request.Name)
            .NotEmpty()
            .Must(name => !string.IsNullOrWhiteSpace(name))
            .Length(ResourceValidationRules.NameMinimumLength, ResourceValidationRules.NameMaximumLength)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage($"'Name' must be between {ResourceValidationRules.NameMinimumLength} and {ResourceValidationRules.NameMaximumLength} characters long")
            .When(request => request.Name is not null);

        RuleFor(request => request.Color)
            .Matches(ResourceValidationRules.HexColorPattern)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("'Color' must be a valid six-digit hex color")
            .When(request => request.Color is not null);

        RuleFor(request => request.Unit)
            .NotEmpty()
            .Must(unit => !string.IsNullOrWhiteSpace(unit))
            .Length(ResourceValidationRules.UnitMinimumLength, ResourceValidationRules.UnitMaximumLength)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage($"'Unit' must be between {ResourceValidationRules.UnitMinimumLength} and {ResourceValidationRules.UnitMaximumLength} characters long")
            .When(request => request.Unit is not null);
    }
}
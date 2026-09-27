using Kijk.Shared;

namespace Kijk.Application.Units.Create;

/// <summary>
/// Validates unit creation requests.
/// </summary>
public sealed class CreateUnitRequestValidator : AbstractValidator<CreateUnitRequest>
{
    public CreateUnitRequestValidator()
    {
        RuleFor(request => request.Name).NotEmpty().MaximumLength(50).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Symbol).NotEmpty().MaximumLength(20).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.ReferenceUnitId).NotEmpty().WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.ConversionFactor).GreaterThan(0).WithErrorCode(ErrorCodes.ValidationError);
    }
}
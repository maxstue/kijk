using Kijk.Shared;

namespace Kijk.Application.Units.Update;

/// <summary>
/// Validates unit update requests.
/// </summary>
public sealed class UpdateUnitRequestValidator : AbstractValidator<UpdateUnitRequest>
{
    public UpdateUnitRequestValidator()
    {
        RuleFor(request => request.Name).NotEmpty().MaximumLength(50).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Symbol).NotEmpty().MaximumLength(20).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.ReferenceUnitId).NotEmpty().WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.ConversionFactor).GreaterThan(0).WithErrorCode(ErrorCodes.ValidationError);
    }
}
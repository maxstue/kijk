using Kijk.Shared;

namespace Kijk.Application.ConsumptionLimits.Create;

/// <summary>
/// Validates requests for creating consumption limits.
/// </summary>
public sealed class CreateConsumptionLimitValidator : AbstractValidator<CreateConsumptionLimitRequest>
{
    public CreateConsumptionLimitValidator()
    {
        RuleFor(request => request.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError)
            .Length(2, 100).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Description)
            .MaximumLength(250).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Limit)
            .GreaterThan(0).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Period)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.ResourceId)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError);
    }
}
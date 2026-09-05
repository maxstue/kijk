using Kijk.Shared;

namespace Kijk.Application.ConsumptionLimits.Update;

/// <summary>
/// Validates requests for updating consumption limits.
/// </summary>
public sealed class UpdateConsumptionLimitValidator : AbstractValidator<UpdateConsumptionLimitRequest>
{
    public UpdateConsumptionLimitValidator()
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
    }
}
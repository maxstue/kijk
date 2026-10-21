using Kijk.Shared;

namespace Kijk.Application.Consumptions.Record;

/// <summary>
/// Validator for the <see cref="CreateConsumptionRequest"/>
/// </summary>
public class CreateConsumptionCommandValidator : AbstractValidator<CreateConsumptionRequest>
{
    /// <summary>Creates the validator rules for new consumptions.</summary>
    /// <param name="timeProvider">The clock used to validate the consumption date.</param>
    public CreateConsumptionCommandValidator(TimeProvider timeProvider)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(2, 50).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be between 2 and 50 characters long");

        RuleFor(x => x.Value)
            .GreaterThanOrEqualTo(0).WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(x => x.ValueType).IsInEnum().WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(x => x.ResourceId)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'ResourceId' must be set");

        RuleFor(x => x.Date)
            .Must(date => date.Date <= timeProvider.GetUtcNow().UtcDateTime.Date)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("'Date' must not be in the future")
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Date' must be set");

        RuleFor(x => x.StartsNewMeterSegment)
            .Equal(false)
            .When(x => x.ValueType != CreateConsumptionValueTypes.Absolute)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("A new meter segment must start with an absolute meter reading");
    }
}
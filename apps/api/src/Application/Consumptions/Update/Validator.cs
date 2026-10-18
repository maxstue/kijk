using Kijk.Shared;

namespace Kijk.Application.Consumptions.Update;

/// <summary>Validates changes to a consumption; omitted values stay unchanged.</summary>
public sealed class UpdateConsumptionRequestValidator : AbstractValidator<UpdateConsumptionRequest>
{
    /// <summary>Creates the rules for consumption changes.</summary>
    /// <param name="timeProvider">The clock used to validate the consumption date.</param>
    public UpdateConsumptionRequestValidator(TimeProvider timeProvider)
    {
        RuleFor(request => request.Name).NotEmpty().Length(2, 50)
            .When(request => request.Name is not null).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Value).GreaterThanOrEqualTo(0).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.ValueType).IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.ResourceId).NotEqual(Guid.Empty)
            .When(request => request.ResourceId is not null).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Date)
            .Must(date => date is null || date.Value != default && date.Value.Date <= timeProvider.GetUtcNow().UtcDateTime.Date)
            .WithErrorCode(ErrorCodes.ValidationError).WithMessage("Date must be set and must not be in the future");
        RuleFor(request => request.StartsNewMeterSegment).Equal(false)
            .When(request => request.ValueType != UpdateConsumptionValueTypes.Absolute).WithErrorCode(ErrorCodes.ValidationError);
    }
}
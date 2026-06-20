using Kijk.Shared;

namespace Kijk.Application.Consumptions.Create;

/// <summary>
/// Validator for the <see cref="CreateConsumptionRequest"/>
/// </summary>
public class CreateConsumptionCommandValidator : AbstractValidator<CreateConsumptionRequest>
{
    public CreateConsumptionCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(2, 50).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be between 2 and 50 characters long");

        RuleFor(x => x.Value)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Value' must be set");

        RuleFor(x => x.ResourceId)
            .NotNull().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'ResourceId' must be set");

        RuleFor(x => x.Date)
            .Must(date => date.Date <= DateTime.UtcNow.Date)
            .WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("'Date' must not be in the future")
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Date' must be set");
    }
}
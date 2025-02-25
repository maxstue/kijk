using Kijk.Application.Energies.Models;
using Kijk.Shared;

namespace Kijk.Application.Energies.Validators;

public class CreateEnergyValidator : AbstractValidator<CreateEnergyRequest>
{
    public CreateEnergyValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(2, 50).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be between 2 and 50 characters long");

        RuleFor(x => x.Value)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Value' must be set");

        RuleFor(x => x.Type)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Type' is not a valid energy consumption type");
        RuleFor(x => x.Date)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Date' must be set");
    }
}
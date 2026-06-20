using Kijk.Shared;

namespace Kijk.Application.Resources.Create;

public class CreateResourceRequestValidator : AbstractValidator<CreateResourceRequest>
{
    public CreateResourceRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(4, 30).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be between 4 and 30 characters long");

        RuleFor(x => x.Color)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Color' must be set")
            .Must(x => x.StartsWith('#')).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Color' must start with a '#'");

        RuleFor(x => x.Unit)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Unit' must be set")
            .Length(2, 10).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Unit' must be between 2 and 10 characters long");
    }
}
using Kijk.Application.Accounts.Shared;
using Kijk.Shared;

namespace Kijk.Application.Accounts.Create;

/// <summary>
/// Validates requests for creating accounts.
/// </summary>
public sealed class CreateAccountValidator : AbstractValidator<CreateAccountRequest>
{
    /// <summary>Creates the validator rules for new accounts.</summary>
    public CreateAccountValidator()
    {
        RuleFor(request => request.Name)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name' must be set")
            .MaximumLength(AccountValidationRules.NameMaximumLength).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.IbanLast4)
            .Matches(AccountValidationRules.IbanLast4Pattern).WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("'IbanLast4' must contain exactly the last four characters of the IBAN")
            .When(request => request.IbanLast4 is not null);
        RuleFor(request => request.Visibility).IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
    }
}
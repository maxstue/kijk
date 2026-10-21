using Kijk.Shared;

namespace Kijk.Application.Budgets.SetFromMonth;

/// <summary>
/// Validates requests for setting budgets.
/// </summary>
public sealed class SetBudgetValidator : AbstractValidator<SetBudgetRequest>
{
    /// <summary>Creates the validator rules for setting budgets.</summary>
    public SetBudgetValidator()
    {
        RuleFor(request => request.CategoryId)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Amount)
            .GreaterThan(0).WithErrorCode(ErrorCodes.ValidationError)
            .PrecisionScale(18, 2, true).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.ValidFrom)
            .Must(date => date.Year is >= 2000 and <= 9999).WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("'ValidFrom' must be a valid month");
        RuleFor(request => request.Visibility).IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
    }
}
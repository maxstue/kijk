using Kijk.Shared;

namespace Kijk.Application.Budgets.Create;

/// <summary>
/// Validates requests for creating budgets.
/// </summary>
public sealed class CreateBudgetValidator : AbstractValidator<CreateBudgetRequest>
{
    /// <summary>Creates the validator rules for new budgets.</summary>
    public CreateBudgetValidator()
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
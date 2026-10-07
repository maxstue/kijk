using Kijk.Shared;

namespace Kijk.Application.Budgets.Update;

/// <summary>
/// Validates requests for updating budgets.
/// </summary>
public sealed class UpdateBudgetValidator : AbstractValidator<UpdateBudgetRequest>
{
    /// <summary>Creates the validator rules for budget updates.</summary>
    public UpdateBudgetValidator()
    {
        RuleFor(request => request.Amount)
            .GreaterThan(0).WithErrorCode(ErrorCodes.ValidationError)
            .PrecisionScale(18, 2, true).WithErrorCode(ErrorCodes.ValidationError);
    }
}
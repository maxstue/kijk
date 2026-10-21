using Kijk.Application.Transactions.Shared;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Update;

/// <summary>
/// Validates requests for updating transactions.
/// </summary>
public sealed class UpdateTransactionValidator : AbstractValidator<UpdateTransactionRequest>
{
    /// <summary>Creates the validator rules for transaction updates.</summary>
    public UpdateTransactionValidator()
    {
        RuleFor(request => request.BookingDate)
            .Must(date => date.Year is >= 2000 and <= 9999).WithErrorCode(ErrorCodes.ValidationError)
            .WithMessage("'BookingDate' must be a valid date");
        RuleFor(request => request.Amount)
            .NotEqual(0).WithErrorCode(ErrorCodes.ValidationError)
            .PrecisionScale(18, 2, true).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Counterparty)
            .MaximumLength(TransactionValidationRules.CounterpartyMaximumLength).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Purpose)
            .MaximumLength(TransactionValidationRules.PurposeMaximumLength).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.Status)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError);
    }
}
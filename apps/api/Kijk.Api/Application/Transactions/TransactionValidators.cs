using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Transactions;

public class TransactionValidator : AbstractValidator<CreateTransactionRequest>
{
    public TransactionValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("'Name‘ must be set")
            .Length(4, 30).WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("'Name‘ must be between 1 and 30 characters long");

        RuleFor(x => x.Amount)
            .NotEmpty().WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("'Amount' must be set");

        RuleFor(x => x.Type)
            .IsInEnum().WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("'Type' is not a valid transaction type");

        RuleFor(x => x.ExecutedAt)
            .NotEmpty().WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("'ExecutedAt' must be set");
    }
}

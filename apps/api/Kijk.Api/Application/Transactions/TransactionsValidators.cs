using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Transactions;

public class CreateTransactionsValidator : AbstractValidator<CreateTransactionRequest>
{
    public CreateTransactionsValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(TransactionsErrors.Codes.PostValidationError).WithMessage("'Name‘ must be set")
            .Length(4, 30).WithErrorCode(TransactionsErrors.Codes.PostValidationError).WithMessage("'Name‘ must be between 1 and 30 characters long");

        RuleFor(x => x.Amount)
            .NotEmpty().WithErrorCode(TransactionsErrors.Codes.PostValidationError).WithMessage("'Amount' must be set");

        RuleFor(x => x.Type)
            .IsInEnum().WithErrorCode(TransactionsErrors.Codes.PostValidationError).WithMessage("'Type' is not a valid transaction type");

        RuleFor(x => x.ExecutedAt)
            .NotEmpty().WithErrorCode(TransactionsErrors.Codes.PostValidationError).WithMessage("'ExecutedAt' must be set");
    }
}

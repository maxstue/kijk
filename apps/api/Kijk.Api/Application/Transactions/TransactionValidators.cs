using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Application.Transactions;

public class TransactionValidator : AbstractValidator<CreateTransactionRequest>
{
    public TransactionValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("Name must be set")
            .Length(4, 30).WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("Name must be between 1 and 30 characters long");

        RuleFor(x => x.Amount)
            .NotEmpty().WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("Amount must be set")
            .Must((c, v) => c.Type is TransactionType.Income && v >= 0 || c.Type is TransactionType.Expense && v < 0)
            .WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("The Income must be equal or higher than 0 or your Expense must be lower than 0");

        RuleFor(x => x.Type)
            .NotEmpty().WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("The Type must be set")
            .IsInEnum().WithErrorCode(TransactionErrors.Codes.PostValidationError).WithMessage("Type is not a valid transaction type");
    }
}

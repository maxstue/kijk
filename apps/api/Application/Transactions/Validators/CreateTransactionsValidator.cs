using Kijk.Application.Transactions.Models;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Validators;

public class CreateTransactionsValidator : AbstractValidator<CreateTransactionRequest>
{
    public CreateTransactionsValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(2, 50).WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Name‘ must be between 2 and 50 characters long");

        RuleFor(x => x.Amount)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Amount' must be set");

        RuleFor(x => x.Type)
            .IsInEnum().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'Type' is not a valid transaction type");

        RuleFor(x => x.ExecutedAt)
            .NotEmpty().WithErrorCode(ErrorCodes.ValidationError).WithMessage("'ExecutedAt' must be set");
    }
}
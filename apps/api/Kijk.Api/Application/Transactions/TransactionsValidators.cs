using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Transactions;

public class CreateTransactionsValidator : AbstractValidator<CreateTransactionRequest>
{
    public CreateTransactionsValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Name‘ must be set")
            .Length(4, 30).WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Name‘ must be between 1 and 30 characters long");

        RuleFor(x => x.Amount)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Amount' must be set");

        RuleFor(x => x.Type)
            .IsInEnum().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'Type' is not a valid transaction type");

        RuleFor(x => x.ExecutedAt)
            .NotEmpty().WithErrorCode(AppErrorCodes.ValidationError).WithMessage("'ExecutedAt' must be set");
    }
}

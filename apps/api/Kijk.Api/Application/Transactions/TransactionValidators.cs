namespace Kijk.Api.Application.Transactions;

public class TransactionValidator : AbstractValidator<TransactionDto>
{
    public TransactionValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithErrorCode(TransactionErrors.Codes.PostValidationError)
            .Length(1, 10).WithErrorCode(TransactionErrors.Codes.PostValidationError);
    }
}

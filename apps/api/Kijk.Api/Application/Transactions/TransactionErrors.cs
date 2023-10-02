using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Transactions;

public static class TransactionErrors
{

    public static Error NotFound()
    {
        return Error.NotFound(ErrorCodes.NotFoundError, "Transaction not found");
    }

    public static Error Failure(string message = "")
    {
        return Error.Failure(ErrorCodes.DefaultError, $"Transaction failure,  {message}");
    }

    public static class Codes
    {
        internal const string PostValidationError = "ET0002";
    }
}

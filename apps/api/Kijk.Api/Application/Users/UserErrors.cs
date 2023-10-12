using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Users;

public static class UserErrors
{

    public static Error NotFound()
    {
        return Error.NotFound(ErrorCodes.NotFoundError, "User not found");
    }

    public static Error Failure(string message = "")
    {
        return Error.Failure(ErrorCodes.DefaultError, $"User failure,  {message}");
    }

    public static class Codes
    {
        internal const string PostValidationError = "EU0001";
    }
}

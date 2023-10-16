using Kijk.Api.Common.Models;

namespace Kijk.Api.Application.Categories;

public static class CategoriesErrors
{
    public static Error NotFound()
    {
        return Error.NotFound(ErrorCodes.NotFoundError, "Category not found");
    }

    public static Error Failure(string message = "")
    {
        return Error.Failure(ErrorCodes.DefaultError, $"Category failure,  {message}");
    }

    public static class Codes
    {
        internal const string PostValidationError = "EC0001";
    }
}

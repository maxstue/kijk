using Kijk.Api.Common.Models;

namespace Kijk.Api.Common.Utils;

public static class ResponseUtils
{
    public static int ToStatusCode(SuccessType successType)
    {
        var statusCode = successType switch
        {
            SuccessType.Created => StatusCodes.Status201Created,
            _ => StatusCodes.Status200OK
        };
        return statusCode;
    }

    public static int ToStatusCode(ErrorType errorType)
    {
        var statusCode = errorType switch
        {
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status500InternalServerError
        };
        return statusCode;
    }

    public static IResult CreateTypedResult<TP>(ApiResponse<TP> response, int statusCode) => TypedResults.Json(response, contentType: "application/json", statusCode: statusCode);
}
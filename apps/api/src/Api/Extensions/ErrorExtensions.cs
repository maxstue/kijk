using Kijk.Shared;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Extensions;

/// <summary>
/// Extensions for <see cref="Error"/>.
/// </summary>
public static class ErrorExtensions
{
    /// <summary>
    /// Sends the <see cref="Error"/> to Sentry.
    /// </summary>
    /// <param name="error"></param>
    public static Error SentToSentry(this Error error)
    {
        SentrySdk.CaptureMessage(error.Description, opt =>
        {
            opt.SetExtra("Response", error);
            opt.SetExtra("Code", error.Code);
        });
        return error;
    }

    /// <summary>
    /// Converts the <see cref="Error"/> to a <see cref="ProblemDetails"/>.
    /// </summary>
    /// <param name="error"></param>
    /// <returns></returns>
    public static ProblemDetails ToProblemDetails(this Error error) => new()
    {
        Status = GetStatusCode(error.Type),
        Title = GetTitle(error.Type),
        Detail = error.Description,
        Extensions = new Dictionary<string, object?> { ["errors"] = new[] { error } }
    };

    private static int GetStatusCode(ErrorType errorType) => errorType switch
    {
        ErrorType.Authentication => StatusCodes.Status401Unauthorized,
        ErrorType.Authorization => StatusCodes.Status403Forbidden,
        ErrorType.NotFound => StatusCodes.Status404NotFound,
        ErrorType.Conflict => StatusCodes.Status409Conflict,
        ErrorType.Unexpected => StatusCodes.Status500InternalServerError,
        _ => StatusCodes.Status400BadRequest
    };

    private static string GetTitle(ErrorType errorType) => errorType switch
    {
        ErrorType.Authentication => "Authentication error",
        ErrorType.Authorization => "Authorization error",
        ErrorType.NotFound => "Resource not found",
        ErrorType.Conflict => "Conflict",
        _ => "Unexpected Server error",
    };
}
using Kijk.Api.Extensions;
using Kijk.Shared;
using Microsoft.AspNetCore.Diagnostics;

namespace Kijk.Api.Middleware;

/// <summary>
/// The Global exception handler. Sentry captures the exception itself, so the response only contains a generic
/// message and never internal details of the exception.
/// </summary>
/// <param name="problemDetailsService">Writes problem-details responses.</param>
public class GlobalExceptionHandler(IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    /// <inheritdoc />
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

        return await problemDetailsService.TryWriteAsync(new()
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = Error.Unexpected().ToProblemDetails()
        });
    }
}
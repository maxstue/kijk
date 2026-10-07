using Kijk.Api.Extensions;
using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Microsoft.AspNetCore.Diagnostics;

namespace Kijk.Api.Middleware;

/// <summary>
/// The Global exception handler.
/// </summary>
/// <param name="problemDetailsService">Writes problem-details responses.</param>
/// <param name="telemetryService">Reports errors to the telemetry service.</param>
public class GlobalExceptionHandler(IProblemDetailsService problemDetailsService, ITelemetryService telemetryService) : IExceptionHandler
{
    /// <inheritdoc />
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var problemDetails = Error.Unexpected(exception.Message).ToProblemDetails();

        telemetryService.SendProblemDetails(problemDetails);

        return await problemDetailsService.TryWriteAsync(new()
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = problemDetails
        });
    }
}
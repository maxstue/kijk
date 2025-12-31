using Kijk.Api.Extensions;
using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Microsoft.AspNetCore.Diagnostics;

namespace Kijk.Api.Middleware;

/// <summary>
/// The Global exception handler.
/// </summary>
/// <param name="problemDetailsService"></param>
/// <param name="telemetryService"></param>
public class GlobalExceptionHandler(IProblemDetailsService problemDetailsService, ITelemetryService telemetryService) : IExceptionHandler
{
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
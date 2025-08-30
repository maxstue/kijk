using Kijk.Api.Extensions;
using Kijk.Shared;
using Microsoft.AspNetCore.Diagnostics;

namespace Kijk.Api.Middleware;

public class GlobalExceptionHandler(IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var problemDetails = Error.Unexpected(exception.Message)
            .SentToSentry()
            .ToProblemDetails();
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext, Exception = exception, ProblemDetails = problemDetails
        });
    }
}
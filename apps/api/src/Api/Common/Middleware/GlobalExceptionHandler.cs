using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Diagnostics;

namespace Kijk.Api.Common.Middleware;

public class GlobalExceptionHandler(IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var problemDetails = Error.Unexpected(description: exception.Message)
            .SentToSentry()
            .ToProblemDetails();
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext, Exception = exception, ProblemDetails = problemDetails
        });
    }
}
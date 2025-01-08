using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;

namespace Kijk.Api.Common.Middleware;

public class AuthResponseHandlerMiddleware(IProblemDetailsService problemDetailsService) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        await next(context);

        var error = CreateError(context).SentToSentry();
        await problemDetailsService.TryWriteAsync(new ProblemDetailsContext { HttpContext = context, ProblemDetails = error.ToProblemDetails() });
    }

    private static Error CreateError(HttpContext context)
    {
        var error = context.Response.StatusCode switch
        {
            StatusCodes.Status401Unauthorized => Error.Custom(ErrorType.Authentication, ErrorCodes.AuthenticationError, "You are not authenticated"),
            StatusCodes.Status403Forbidden => Error.Custom(ErrorType.Authorization, ErrorCodes.AuthorizationError, "You are not authorized"),
            _ => Error.Unexpected(description: "Unexpected error")
        };
        return error;
    }
}
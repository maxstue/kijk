using System.Net;
using System.Security.Authentication;
using System.Text.Json;

using Kijk.Api.Common.Models;

using Microsoft.AspNetCore.Diagnostics;

using Sentry;

namespace Kijk.Api.Common.Middleware;

public static class AuthResponseHandlerMiddleware
{
    public static void UseCustomAuthResponseHandler(this IApplicationBuilder app)
    {
        app.Use(
            async (context, next) =>
            {
                await next();
                context.Response.ContentType = "application/json";

                if (context.Response.StatusCode == (int)HttpStatusCode.Unauthorized)
                {
                    var resp = ApiResponse<IResult>.Error([AppError.Basic(AppErrorCodes.AuthenticationError, "Token is not valid")]);
                    SentToSentry(resp);
                    await context.Response.WriteAsync(JsonSerializer.Serialize(resp));
                }

                if (context.Response.StatusCode == (int)HttpStatusCode.Forbidden)
                {
                    var resp =
                        ApiResponse<IResult>.Error([AppError.Basic(AppErrorCodes.AuthorizationError, "Role is not sufficient")]);
                    SentToSentry(resp);
                    await context.Response.WriteAsync(JsonSerializer.Serialize(resp));
                }
            });
    }

    private static void SentToSentry(ApiResponse<List<AppError>> resp)
    {
        SentrySdk.CaptureEvent(
            new SentryEvent(new AuthenticationException(resp.Data?[0].Message)),
            o =>
            {
                o.SetExtra("Response", resp);
            });
    }
}

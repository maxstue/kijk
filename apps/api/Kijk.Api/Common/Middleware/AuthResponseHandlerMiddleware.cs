using System.Net;
using System.Text.Json;

using Kijk.Api.Common.Models;

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
                    await context.Response.WriteAsync(
                        JsonSerializer.Serialize(
                            ApiResponse<IResult>.Error(new List<Error> { Error.Failure(ErrorCodes.AuthenticationError, "Token ist nicht valide") })));
                }

                if (context.Response.StatusCode == (int)HttpStatusCode.Forbidden)
                {
                    await context.Response.WriteAsync(
                        JsonSerializer.Serialize(
                            ApiResponse<IResult>.Error(
                                new List<Error> { Error.Failure(ErrorCodes.AuthorizationError, "Role ist nicht ausreichend") })));
                }
            });
    }
}

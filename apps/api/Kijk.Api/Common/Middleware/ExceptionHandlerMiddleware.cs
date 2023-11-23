using System.Net;
using System.Text.Json;
using Kijk.Api.Common.Models;
using Microsoft.AspNetCore.Diagnostics;
using Sentry;

namespace Kijk.Api.Common.Middleware;

public static class ExceptionHandlerMiddleware
{
    public static void UseCustomExceptionHandler(this IApplicationBuilder app)
    {
        app.UseExceptionHandler(
            appError =>
            {
                appError.Run(
                    async context =>
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                        context.Response.ContentType = "application/json";

                        var exceptionHandlerFeature = context.Features.Get<IExceptionHandlerFeature>();
                        if (exceptionHandlerFeature is not null)
                        {
                            SentrySdk.CaptureException(exceptionHandlerFeature.Error);
                            Log.ForContext(typeof(ExceptionHandlerMiddleware)).Error(
                                "Something went wrong: {ContextFeatureError}",
                                exceptionHandlerFeature.Error.Message);

                            var error = AppError.Unexpected(
                                AppErrorCodes.UnexpectedError,
                                $"Ups, etwas ist schief gelaufen. {exceptionHandlerFeature.Error.Message}");
                            var json = JsonSerializer.Serialize(ApiResponse<IResult>.Error(error));
                            await context.Response.WriteAsync(json);
                        }
                    });
            });
    }
}

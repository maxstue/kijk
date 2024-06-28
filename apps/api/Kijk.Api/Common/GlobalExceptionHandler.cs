using System.Net;
using System.Text.Json;

using Kijk.Api.Common.Models;

using Microsoft.AspNetCore.Diagnostics;

using Sentry;

namespace Kijk.Api.Common;

public class GlobalExceptionHandler : IExceptionHandler
{

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        httpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        httpContext.Response.ContentType = "application/json";

        var exceptionHandlerFeature = httpContext.Features.Get<IExceptionHandlerFeature>();
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
            await httpContext.Response.WriteAsync(json, cancellationToken: cancellationToken);
        }

        return true;
    }
}

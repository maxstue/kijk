using Serilog.Context;

namespace Kijk.Api.Middleware;

public class ExtendRequestLoggingMiddleware : IMiddleware
{
    private const string RequestIdHeaderName = "X-Request-Id";

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var requestId = GetRequestId(context);
        using (LogContext.PushProperty("RequestId", requestId))
        {
            await next(context);
        }
    }

    private static string GetRequestId(HttpContext context)
    {
        context.Request.Headers.TryGetValue(RequestIdHeaderName, out var requestid);
        return requestid.FirstOrDefault() ?? context.TraceIdentifier;
    }
}
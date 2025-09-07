using System.Diagnostics;
using Serilog.Context;

namespace Kijk.Api.Middleware;

public class ExtendRequestLoggingMiddleware : IMiddleware
{
    private const string HeaderName = "X-Trace-Id";

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var traceId = GetTraceId(context);
        using (LogContext.PushProperty("traceId", traceId))
        {
            await next(context);
        }
    }

    private static string GetTraceId(HttpContext context)
    {
        context.Request.Headers.TryGetValue(HeaderName, out var headerId);
        return headerId.FirstOrDefault() ?? Activity.Current?.Id ?? context.TraceIdentifier;
    }
}
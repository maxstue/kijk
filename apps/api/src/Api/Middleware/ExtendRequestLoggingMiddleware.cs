using Microsoft.AspNetCore.Http.Features;
using Serilog.Context;

namespace Kijk.Api.Middleware;

/// <summary>
/// Middleware to extend the request logging.
/// It adds the correlation id to the log context.
/// </summary>
public class ExtendRequestLoggingMiddleware : IMiddleware
{
    private const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var correlationId = GetCorrelationId(context);
        using (LogContext.PushProperty("correlationId", correlationId))
        {
            await next(context);
        }
    }

    private static string GetCorrelationId(HttpContext context)
    {
        context.Request.Headers.TryGetValue(HeaderName, out var headerId);
        var activity = context.Features.Get<IHttpActivityFeature>()?.Activity;
        return headerId.FirstOrDefault() ?? activity?.Id ?? context.TraceIdentifier;
    }
}
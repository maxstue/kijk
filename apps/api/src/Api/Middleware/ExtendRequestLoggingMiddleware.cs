using Serilog.Context;

namespace Kijk.Api.Middleware;

/// <summary>
/// Middleware to extend the request logging.
/// It adds the correlation id to the log context.
/// </summary>
public class ExtendRequestLoggingMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var correlationId = CorrelationIdProvider.Get(context);
        using (LogContext.PushProperty("correlationId", correlationId))
        {
            await next(context);
        }
    }
}
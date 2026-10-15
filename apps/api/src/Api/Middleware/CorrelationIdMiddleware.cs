using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.Features;
using Serilog.Context;

namespace Kijk.Api.Middleware;

/// <summary>
/// Assigns every request its own correlation id and attaches it to the response header, the log context and
/// telemetry events. Ids sent by the client are ignored, so an id always identifies exactly one request.
/// </summary>
/// <param name="telemetryService">The telemetry service.</param>
public class CorrelationIdMiddleware(ITelemetryService telemetryService) : IMiddleware
{
    private static readonly object ItemKey = new();

    /// <summary>Gets the correlation id of the request.</summary>
    /// <param name="context">The HTTP context.</param>
    /// <returns>The correlation id.</returns>
    public static string Get(HttpContext context)
    {
        if (context.Items.TryGetValue(ItemKey, out var value) && value is string correlationId)
        {
            return correlationId;
        }

        correlationId = context.Features.Get<IHttpActivityFeature>()?.Activity.Id ?? context.TraceIdentifier;
        context.Items[ItemKey] = correlationId;
        return correlationId;
    }

    /// <inheritdoc />
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var correlationId = Get(context);
        // Set when the response starts, because the exception handler clears the headers of failed requests.
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[AppConstants.CorrelationId] = correlationId;
            return Task.CompletedTask;
        });
        telemetryService.SetCorrelationId(correlationId);

        using (LogContext.PushProperty("correlationId", correlationId))
        {
            await next(context);
        }
    }
}
using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;

namespace Kijk.Api.Middleware;

/// <summary>Attaches the request's correlation id to telemetry events.</summary>
/// <param name="telemetryService">The telemetry service.</param>
public class TelemetryMiddleware(ITelemetryService telemetryService) : IMiddleware
{
    /// <inheritdoc />
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var correlationId = CorrelationIdProvider.Get(context);
        telemetryService.SetCorrelationId(correlationId);

        // write correlationId into response header for client reference
        context.Response.Headers[AppConstants.CorrelationId] = correlationId;
        await next(context);
    }
}
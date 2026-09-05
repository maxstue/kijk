using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.Features;

namespace Kijk.Api.Middleware;

public class TelemetryMiddleware(ITelemetryService telemetryService) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var correlationId = GetCorrelationId(context);
        telemetryService.SetCorrelationId(correlationId);

        // write correlationId into response header for client reference
        context.Response.Headers[AppConstants.CorrelationId] = correlationId;
        await next(context);
    }

    // TODO : DRY with ExtendRequestLoggingMiddleware
    private static string GetCorrelationId(HttpContext context)
    {
        context.Request.Headers.TryGetValue(AppConstants.CorrelationId, out var headerId);
        var activity = context.Features.Get<IHttpActivityFeature>()?.Activity;
        return headerId.FirstOrDefault() ?? activity?.Id ?? context.TraceIdentifier;
    }
}
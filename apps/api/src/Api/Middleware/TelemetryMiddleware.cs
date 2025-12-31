using System.Security.Claims;
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

        var (userId, extAuthId) = GetRawUser(context.User);
        telemetryService.SetUser(userId, extAuthId);

        // write correlationId into response header for client reference
        context.Response.Headers[AppConstants.Policies.CorrelationId] = correlationId;
        await next(context);
    }

    private static (string?, string?) GetRawUser(ClaimsPrincipal user)
    {
        var userId = user.FindFirstValue("sub");
        var externalAuthId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return (userId, externalAuthId);
    }

    // TODO : DRY with ExtendRequestLoggingMiddleware
    private static string GetCorrelationId(HttpContext context)
    {
        context.Request.Headers.TryGetValue(AppConstants.Policies.CorrelationId, out var headerId);
        var activity = context.Features.Get<IHttpActivityFeature>()?.Activity;
        return headerId.FirstOrDefault() ?? activity?.Id ?? context.TraceIdentifier;
    }
}
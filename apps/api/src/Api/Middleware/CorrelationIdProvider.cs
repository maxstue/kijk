using Kijk.Shared;
using Microsoft.AspNetCore.Http.Features;

namespace Kijk.Api.Middleware;

internal static class CorrelationIdProvider
{
    internal static string Get(HttpContext context)
    {
        context.Request.Headers.TryGetValue(AppConstants.CorrelationId, out var headerId);
        var activity = context.Features.Get<IHttpActivityFeature>()?.Activity;
        return headerId.FirstOrDefault() ?? activity?.Id ?? context.TraceIdentifier;
    }
}
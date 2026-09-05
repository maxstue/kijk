using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Sentry.AspNetCore;
using Sentry.Extensibility;

namespace Kijk.Infrastructure.Telemetry;

public static class HostExtensions
{
    /// <summary>
    /// Adds telemetry tracking to the application.
    /// This includes error reporting to Sentry.
    /// </summary>
    /// <param name="builder"></param>
    /// <returns></returns>
    public static WebApplicationBuilder AddTelemetryTracking(this WebApplicationBuilder builder)
    {
        builder.WebHost.UseSentry(options =>
        {
            options.SendDefaultPii = false;
            options.MaxRequestBodySize = RequestSize.None;
            options.MinimumBreadcrumbLevel = LogLevel.Error;
            options.MaxBreadcrumbs = 0;
            options.IncludeActivityData = false;
            options.TracesSampleRate = 0;
            options.EnableLogs = false;
            options.SetBeforeSend(TelemetryEventScrubber.Scrub);
        });
        return builder;
    }
}
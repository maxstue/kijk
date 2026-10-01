using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Sentry.AspNetCore;
using Sentry.Extensibility;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>Host builder extensions for telemetry.</summary>
public static class HostExtensions
{
    /// <summary>
    /// Adds telemetry tracking to the application.
    /// This includes error reporting to Sentry.
    /// </summary>
    /// <param name="builder">The web application builder.</param>
    /// <returns>The web application builder.</returns>
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
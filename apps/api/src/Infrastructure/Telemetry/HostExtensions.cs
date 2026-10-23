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
    /// Adds Sentry error tracking to the application. It is set up here and not with the other telemetry because
    /// <c>UseSentry</c> hooks into the web host. PostHog and the traces of both tools are registered in
    /// <c>TelemetryDependencyInjection.AddTelemetry</c>; traces reach Sentry over OTLP, the same way they reach PostHog.
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
            options.AutoSessionTracking = false;
            options.EnableLogs = false;
            options.AddInAppInclude("Kijk");
            // Links errors to the OpenTelemetry trace and turns off Sentry's own tracing.
            options.UseOtlp();
            options.SetBeforeSend(TelemetryEventScrubber.Scrub);
        });
        return builder;
    }
}
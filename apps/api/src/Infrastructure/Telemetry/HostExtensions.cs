using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

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
        builder.WebHost.UseSentry();
        return builder;
    }
}
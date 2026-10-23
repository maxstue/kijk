using Microsoft.Extensions.Configuration;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>The telemetry destinations that are configured. Both receive exactly the same traces and errors.</summary>
/// <param name="SentryDsn">The Sentry DSN (<c>Sentry__Dsn</c>), or empty when Sentry is not used.</param>
/// <param name="PostHogToken">The PostHog project token (<c>PostHog__ProjectToken</c>), or empty when PostHog is not used.</param>
/// <param name="PostHogHost">The PostHog ingestion host (<c>PostHog__HostUrl</c>).</param>
internal sealed record TelemetryDestinations(string? SentryDsn, string? PostHogToken, Uri PostHogHost)
{
    private const string DefaultPostHogHost = "https://us.i.posthog.com";

    /// <summary>Gets whether errors and traces are sent to Sentry.</summary>
    public bool Sentry { get; } = !string.IsNullOrWhiteSpace(SentryDsn);

    /// <summary>Gets whether errors and traces are sent to PostHog.</summary>
    public bool PostHog { get; } = !string.IsNullOrWhiteSpace(PostHogToken);

    /// <summary>Gets whether any destination receives telemetry.</summary>
    public bool Any => Sentry || PostHog;

    /// <summary>Reads the destinations from the configuration.</summary>
    /// <param name="configuration">The application configuration.</param>
    /// <returns>The configured destinations.</returns>
    public static TelemetryDestinations From(IConfiguration configuration)
    {
        var host = configuration["PostHog:HostUrl"];
        return new(
            configuration["Sentry:Dsn"],
            configuration["PostHog:ProjectToken"],
            Uri.TryCreate(host, UriKind.Absolute, out var uri) ? uri : new(DefaultPostHogHost));
    }
}
using System.ComponentModel.DataAnnotations;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Settings shared by every telemetry destination, so Sentry and PostHog receive the same traces and errors. The
/// destinations are configured by their own settings (<c>Sentry__Dsn</c>, <c>PostHog__ProjectToken</c> and
/// <c>PostHog__HostUrl</c>); a destination without settings is skipped.
/// </summary>
public sealed class TelemetryOptions
{
    /// <summary>Gets the configuration section name.</summary>
    public static string SectionName => "Telemetry";

    /// <summary>
    /// Gets or sets the share of traces that is exported, from 0 (none) to 1 (all). The decision is made once per trace,
    /// so every destination receives the same traces. Traces hold route templates, status codes and timings only.
    /// </summary>
    [Range(0, 1)]
    public double TracesSampleRate { get; set; }

    /// <summary>Gets or sets the PostHog survey id for voluntarily submitted feedback; empty disables submission.</summary>
    public string? FeedbackSurveyId { get; set; }
}
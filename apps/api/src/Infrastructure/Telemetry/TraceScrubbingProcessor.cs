using System.Diagnostics;
using OpenTelemetry;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Reduces every finished span to technical fields before any exporter sees it, so Sentry and PostHog receive the same
/// spans. Only allowlisted attributes remain: SQL text, connection details, URLs, client addresses and exception
/// messages never leave the process.
/// </summary>
internal sealed class TraceScrubbingProcessor : BaseProcessor<Activity>
{
    private const string ExceptionEvent = "exception";

    private static readonly HashSet<string> AllowedTags =
    [
        // Request
        "http.request.method", "http.response.status_code", "http.route", "url.scheme", "network.protocol.name", "network.protocol.version",
        "server.address", "server.port",
        // Outcome
        "error.type", "db.response.status_code",
        // Database, without statement text and connection details
        "db.system.name", "db.operation.name", "db.collection.name",
        // Background jobs
        "messaging.system", "messaging.operation.type", "messaging.destination.name", "wolverine.message_type",
        // Links a span to the response header and to the errors of the request
        TelemetryEventScrubber.CorrelationIdTag
    ];

    /// <inheritdoc />
    public override void OnEnd(Activity data)
    {
        // Span events (exception message, stack trace and SQL error details) cannot be edited, so spans that carry one are
        // not exported. The failure itself reaches both tools as an error and as the error status of the request span.
        if (data.Events.Any(spanEvent => spanEvent.Name == ExceptionEvent))
        {
            data.ActivityTraceFlags = ActivityTraceFlags.None;
            return;
        }

        foreach (var key in data.TagObjects.Select(tag => tag.Key).Where(key => !AllowedTags.Contains(key)).ToArray())
        {
            data.SetTag(key, null);
        }

        // The status description often holds an exception message; the status code is enough.
        if (data.Status == ActivityStatusCode.Error)
        {
            data.SetStatus(ActivityStatusCode.Error);
        }
    }
}
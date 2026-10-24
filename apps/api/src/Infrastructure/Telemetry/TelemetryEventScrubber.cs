using Sentry.Protocol;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Removes application and user data from a Sentry error event immediately before transmission.
/// <see cref="PostHogEventScrubber" /> applies the same rules to PostHog, so both tools receive the same information.
/// </summary>
public static class TelemetryEventScrubber
{
    /// <summary>The tag that carries the correlation id of the failing request.</summary>
    internal const string CorrelationIdTag = "correlation_id";

    /// <summary>The tag that carries the id of the trace the error occurred in.</summary>
    internal const string TraceIdTag = "trace_id";

    /// <summary>The value that replaces every exception message.</summary>
    internal const string FilteredValue = "[Filtered]";

    private static readonly HashSet<string> AllowedTags = [CorrelationIdTag, TraceIdTag];

    /// <summary>
    /// Reduces an event to technical diagnostics and explicitly allowlisted tags.
    /// </summary>
    /// <param name="sentryEvent">The event assembled by the SDK.</param>
    /// <returns>The scrubbed event.</returns>
    public static SentryEvent Scrub(SentryEvent sentryEvent)
    {
        sentryEvent.User = new();
        sentryEvent.Request = new();
        sentryEvent.Message = null;
        sentryEvent.ServerName = string.Empty;
        sentryEvent.TransactionName = string.Empty;

        // The SDK hands out read-only arrays for empty collections, which cannot be cleared and hold nothing to remove.
        if (sentryEvent.Extra is IDictionary<string, object> { IsReadOnly: false } extras)
        {
            extras.Clear();
        }

        if (sentryEvent.Breadcrumbs is ICollection<Breadcrumb> { IsReadOnly: false } breadcrumbs)
        {
            breadcrumbs.Clear();
        }

        // The trace context is the only context that survives: it links the error to the trace in the same tool.
        var trace = sentryEvent.Contexts.TryGetValue(Trace.Type, out var context) ? context as Trace : null;
        var traceId = trace?.TraceId;
        var spanId = trace?.SpanId;
        sentryEvent.Contexts.Clear();
        if (traceId is { } linkedTrace && linkedTrace != SentryId.Empty && spanId is { } linkedSpan)
        {
            sentryEvent.Contexts.Trace.TraceId = linkedTrace;
            sentryEvent.Contexts.Trace.SpanId = linkedSpan;
        }

        sentryEvent.Modules.Clear();

        if (sentryEvent.Fingerprint is { Count: > 0 })
        {
            sentryEvent.SetFingerprint();
        }

        if (sentryEvent.SentryThreads is ICollection<SentryThread> { IsReadOnly: false } threads)
        {
            threads.Clear();
        }

        sentryEvent.DebugImages?.Clear();

        foreach (var key in sentryEvent.Tags.Keys.Where(key => !AllowedTags.Contains(key)).ToArray())
        {
            sentryEvent.UnsetTag(key);
        }

        foreach (var exception in sentryEvent.SentryExceptions ?? [])
        {
            exception.Value = FilteredValue;
            exception.Mechanism = null;

            foreach (var frame in exception.Stacktrace?.Frames ?? [])
            {
                frame.AbsolutePath = null;
                frame.ContextLine = null;
                frame.PreContext.Clear();
                frame.PostContext.Clear();
                frame.Vars.Clear();
            }
        }

        return sentryEvent;
    }

}
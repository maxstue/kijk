using Sentry.Protocol;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Removes application and user data from an error event immediately before transmission.
/// </summary>
public static class TelemetryEventScrubber
{
    private static readonly HashSet<string> AllowedTags = ["correlation_id", "error_code", "error_type", "http_status"];

    /// <summary>
    /// Reduces an event to technical diagnostics and explicitly allowlisted tags.
    /// </summary>
    /// <param name="sentryEvent">The event assembled by the SDK.</param>
    /// <returns>The scrubbed event.</returns>
    public static SentryEvent Scrub(SentryEvent sentryEvent)
    {
        sentryEvent.User = new();
        sentryEvent.Request = new();
        sentryEvent.Message = sentryEvent.Exception is null
            ? $"API problem [{GetTag(sentryEvent, "http_status")}/{GetTag(sentryEvent, "error_type")}/{GetTag(sentryEvent, "error_code")}]"
            : null;
        sentryEvent.ServerName = string.Empty;
        sentryEvent.TransactionName = string.Empty;

        if (sentryEvent.Extra is IDictionary<string, object> extras)
        {
            extras.Clear();
        }

        if (sentryEvent.Breadcrumbs is ICollection<Breadcrumb> breadcrumbs)
        {
            breadcrumbs.Clear();
        }

        sentryEvent.Contexts.Clear();
        sentryEvent.Modules.Clear();

        if (sentryEvent.Fingerprint is ICollection<string> fingerprint)
        {
            fingerprint.Clear();
        }

        if (sentryEvent.SentryThreads is ICollection<SentryThread> threads)
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
            exception.Value = "[Filtered]";
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

    private static string GetTag(SentryEvent sentryEvent, string key)
        => sentryEvent.Tags.TryGetValue(key, out var value) ? value : "unknown";
}
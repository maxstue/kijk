using System.Diagnostics;
using System.Runtime.CompilerServices;
using PostHog;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Sends errors to PostHog error tracking. Sentry receives the same errors through its own Serilog sink. The SDK builds the
/// <c>$exception</c> event; <see cref="PostHogEventScrubber" /> reduces it to the same information Sentry receives.
/// Errors are anonymous: they carry no person and no user id.
/// </summary>
/// <param name="client">The PostHog client.</param>
internal sealed class PostHogErrorSink(IPostHogClient client)
{
    private static readonly object Reported = new();
    private readonly ConditionalWeakTable<Exception, object> seen = [];

    /// <summary>Reports an exception once, however often it is logged on its way up.</summary>
    /// <param name="exception">The exception.</param>
    public void Capture(Exception exception)
    {
        if (!seen.TryAdd(exception, Reported))
        {
            return;
        }

        var properties = new Dictionary<string, object> { [PostHogEventScrubber.ProcessPersonProfile] = false };
        if (Activity.Current is { IdFormat: ActivityIdFormat.W3C } activity)
        {
            properties[TelemetryEventScrubber.TraceIdTag] = activity.TraceId.ToString();
            if (CorrelationId(activity) is { } correlationId)
            {
                properties[TelemetryEventScrubber.CorrelationIdTag] = correlationId;
            }
        }

        // PostHog needs a distinct id; a fresh one per error keeps errors from being attributed to anyone.
        client.CaptureException(exception, Guid.NewGuid().ToString("N"), properties);
    }

    // The correlation id middleware tags the request activity; errors can occur in its child activities.
    private static string? CorrelationId(Activity activity)
    {
        for (var current = activity; current is not null; current = current.Parent)
        {
            if (current.GetTagItem(TelemetryEventScrubber.CorrelationIdTag) is string correlationId)
            {
                return correlationId;
            }
        }

        return null;
    }
}
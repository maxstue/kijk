using PostHog.Api;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Removes application and user data from a PostHog <c>$exception</c> event immediately before transmission. It applies
/// the rules of <see cref="TelemetryEventScrubber" /> to the PostHog event shape: messages, source code, file paths and
/// runtime details are removed, stack frames and the allowlisted identifiers remain.
/// </summary>
internal static class PostHogEventScrubber
{
    /// <summary>The property that keeps PostHog from creating a person for the event.</summary>
    internal const string ProcessPersonProfile = "$process_person_profile";

    private const string ExceptionList = "$exception_list";
    private const string ExceptionMessage = "$exception_message";

    private static readonly HashSet<string> AllowedProperties =
    [
        "$exception_type", "$exception_level", ExceptionList, ExceptionMessage, "$lib", "$lib_version", "$geoip_disable", "$is_server",
        ProcessPersonProfile, "distinct_id", TelemetryEventScrubber.CorrelationIdTag, TelemetryEventScrubber.TraceIdTag
    ];

    private static readonly HashSet<string> AllowedFrameFields = ["filename", "function", "module", "lineno", "colno", "platform", "lang", "in_app"];

    /// <summary>Reduces an event to technical diagnostics and explicitly allowlisted properties.</summary>
    /// <param name="capturedEvent">The event assembled by the SDK.</param>
    /// <returns>The scrubbed event.</returns>
    internal static CapturedEvent Scrub(CapturedEvent capturedEvent)
    {
        var properties = capturedEvent.Properties;
        foreach (var key in properties.Keys.Where(key => !AllowedProperties.Contains(key)).ToArray())
        {
            properties.Remove(key);
        }

        if (properties.ContainsKey(ExceptionMessage))
        {
            properties[ExceptionMessage] = TelemetryEventScrubber.FilteredValue;
        }

        if (properties.TryGetValue(ExceptionList, out var list) && list is IEnumerable<IDictionary<string, object>> exceptions)
        {
            properties[ExceptionList] = exceptions.Select(ScrubException).ToList();
        }

        return capturedEvent;
    }

    private static Dictionary<string, object> ScrubException(IDictionary<string, object> exception)
    {
        var scrubbed = new Dictionary<string, object>
        {
            ["value"] = TelemetryEventScrubber.FilteredValue
        };

        if (exception.TryGetValue("type", out var type))
        {
            scrubbed["type"] = type;
        }

        if (exception.TryGetValue("stacktrace", out var stacktrace) && stacktrace is IDictionary<string, object> trace)
        {
            var frames = trace.TryGetValue("frames", out var value) && value is IEnumerable<IDictionary<string, object>> source
                ? source.Select(ScrubFrame).ToList()
                : [];
            scrubbed["stacktrace"] = new Dictionary<string, object> { ["type"] = "raw", ["frames"] = frames };
        }

        return scrubbed;
    }

    private static Dictionary<string, object> ScrubFrame(IDictionary<string, object> frame)
    {
        var scrubbed = frame.Where(field => AllowedFrameFields.Contains(field.Key)).ToDictionary(field => field.Key, field => field.Value);
        scrubbed["in_app"] = frame.TryGetValue("module", out var module) && module is string name && name.StartsWith("Kijk", StringComparison.Ordinal);
        return scrubbed;
    }
}
using Microsoft.Extensions.DependencyInjection;
using Serilog.Core;
using Serilog.Events;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Sends every logged error that carries an exception to PostHog. Logging is the one place where unhandled request
/// exceptions, failed background jobs and handled-but-unexpected failures all pass, and Sentry's Serilog sink reads the
/// same log events, so both tools see the same set. Serilog isolates a failing sink, so telemetry never breaks the caller.
/// </summary>
/// <param name="services">The service provider; the PostHog sink is resolved on first use because it depends on logging.</param>
internal sealed class ErrorTrackingSerilogSink(IServiceProvider services) : ILogEventSink
{
    private static readonly string[] TelemetryLoggers = ["PostHog", "Sentry", "OpenTelemetry"];

    [ThreadStatic]
    private static bool reportingInProgress;

    private readonly Lazy<PostHogErrorSink> sink = new(services.GetRequiredService<PostHogErrorSink>);

    public void Emit(LogEvent logEvent)
    {
        // Failures of the telemetry libraries themselves are never reported, which would feed back into the same pipeline.
        if (logEvent.Level < LogEventLevel.Error || logEvent.Exception is null || reportingInProgress || IsTelemetryLogger(logEvent))
        {
            return;
        }

        Report(sink.Value, logEvent.Exception);
    }

    private static void Report(PostHogErrorSink sink, Exception exception)
    {
        reportingInProgress = true;
        try
        {
            sink.Capture(exception);
        }
        finally
        {
            reportingInProgress = false;
        }
    }

    private static bool IsTelemetryLogger(LogEvent logEvent) =>
        logEvent.Properties.TryGetValue("SourceContext", out var value)
        && value is ScalarValue { Value: string source }
        && TelemetryLoggers.Any(prefix => source.StartsWith(prefix, StringComparison.Ordinal));
}
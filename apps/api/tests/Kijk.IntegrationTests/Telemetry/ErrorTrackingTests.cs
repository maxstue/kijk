using System.Diagnostics;
using System.Text.Json;
using Kijk.Infrastructure.Telemetry;
using Sentry.Protocol;

namespace Kijk.IntegrationTests.Telemetry;

// Sentry and PostHog receive the same error information: type, stack frames and the allowlisted identifiers.
public class ErrorTrackingTests
{
    private const string Secret = "jane@example.test";
    private static readonly string[] ExpectedTags = ["correlation_id", "trace_id"];

    [Test]
    public async Task SentryReceivesOnlyTechnicalDiagnostics()
    {
        var sentryEvent = new SentryEvent(new InvalidOperationException(Secret))
        {
            User = new() { Email = Secret },
            SentryExceptions =
            [
                new()
                {
                    Type = "System.InvalidOperationException",
                    Value = Secret,
                    Stacktrace = new() { Frames = [new() { AbsolutePath = "/build/Handler.cs", ContextLine = $"throw new Exception(\"{Secret}\")", Function = "Handle", Module = "Kijk.Application.Handler" }] }
                }
            ]
        };
        sentryEvent.SetTag("correlation_id", "00-abc-def-01");
        sentryEvent.SetTag("trace_id", "abc");
        sentryEvent.SetTag("customer", Secret);
        sentryEvent.SetExtra("input", Secret);
        sentryEvent.Contexts.Trace.TraceId = SentryId.Parse("5b8efff798038103d269b633813fc60c");
        sentryEvent.Contexts.Trace.SpanId = SpanId.Parse("eee19b7ec3c1b174");
        sentryEvent.Contexts["device"] = new Device { Name = "jane-laptop" };

        var scrubbed = TelemetryEventScrubber.Scrub(sentryEvent);

        var exception = scrubbed.SentryExceptions!.Single();
        await Assert.That(exception.Value).IsEqualTo("[Filtered]");
        await Assert.That(exception.Type).IsEqualTo("System.InvalidOperationException");
        await Assert.That(exception.Stacktrace!.Frames[0].AbsolutePath).IsNull();
        await Assert.That(exception.Stacktrace.Frames[0].ContextLine).IsNull();
        await Assert.That(exception.Stacktrace.Frames[0].Function).IsEqualTo("Handle");
        await Assert.That(scrubbed.Tags.Keys).IsEquivalentTo(ExpectedTags);
        await Assert.That(scrubbed.User.Email).IsNull();
        await Assert.That(scrubbed.Contexts.ContainsKey("device")).IsFalse();
        await Assert.That(scrubbed.Contexts.Trace.TraceId.ToString()).IsEqualTo("5b8efff798038103d269b633813fc60c");
    }

    [Test]
    public async Task PostHogReceivesTheSameInformationAndNoApplicationData()
    {
        await using var posthog = new FakePostHog(options => options.BeforeSend = PostHogEventScrubber.Scrub);
        var sink = new PostHogErrorSink(posthog.Client);
        using var request = new Activity("request").SetIdFormat(ActivityIdFormat.W3C).SetTag("correlation_id", "00-abc-def-01").Start();
        using var child = new Activity("handler").Start();

        sink.Capture(Thrown());
        await posthog.Client.FlushAsync();

        var body = posthog.Requests.Single(request => request.Path == "/batch").Body;
        await Assert.That(body).DoesNotContain(Secret);
        await Assert.That(body).DoesNotContain("pre_context");
        await Assert.That(body).DoesNotContain("context_line");
        await Assert.That(body).DoesNotContain("abs_path");
        await Assert.That(body).DoesNotContain("$os");
        await Assert.That(body).DoesNotContain("personURL");

        using var document = JsonDocument.Parse(body);
        var posthogEvent = document.RootElement.GetProperty("batch")[0];
        var properties = posthogEvent.GetProperty("properties");
        await Assert.That(posthogEvent.GetProperty("event").GetString()).IsEqualTo("$exception");
        await Assert.That(properties.GetProperty("$process_person_profile").GetBoolean()).IsFalse();
        await Assert.That(properties.GetProperty("correlation_id").GetString()).IsEqualTo("00-abc-def-01");
        await Assert.That(properties.GetProperty("trace_id").GetString()).IsEqualTo(child.TraceId.ToString());
        var exception = properties.GetProperty("$exception_list")[0];
        await Assert.That(exception.GetProperty("type").GetString()).IsEqualTo("System.InvalidOperationException");
        await Assert.That(exception.GetProperty("value").GetString()).IsEqualTo("[Filtered]");
        await Assert.That(exception.GetProperty("stacktrace").GetProperty("frames").GetArrayLength()).IsGreaterThan(0);
    }

    [Test]
    public async Task AnExceptionIsReportedOnceHoweverOftenItIsLogged()
    {
        await using var posthog = new FakePostHog();
        var sink = new PostHogErrorSink(posthog.Client);
        var exception = Thrown();

        sink.Capture(exception);
        sink.Capture(exception);
        await posthog.Client.FlushAsync();

        using var document = JsonDocument.Parse(posthog.Requests.Single(request => request.Path == "/batch").Body);
        await Assert.That(document.RootElement.GetProperty("batch").GetArrayLength()).IsEqualTo(1);
    }

    private static InvalidOperationException Thrown()
    {
        try
        {
            throw new InvalidOperationException(Secret);
        }
        catch (InvalidOperationException exception)
        {
            return exception;
        }
    }
}
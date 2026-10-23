using System.Diagnostics;
using Kijk.Infrastructure.Telemetry;

namespace Kijk.IntegrationTests.Telemetry;

public class TraceScrubbingProcessorTests
{
    private const string SourceName = "Kijk.Tests.Scrubbing";
    private static readonly ActivitySource Source = new(SourceName);
    private static readonly string[] AllowedTags = ["correlation_id", "http.request.method", "http.response.status_code", "http.route"];

    [Test]
    public async Task OnlyAllowlistedAttributesLeaveTheProcess()
    {
        using var listener = Listen();
        using var activity = Source.StartActivity("GET /api/spaces/{spaceId}/accounts")!;
        activity.SetTag("http.request.method", "GET");
        activity.SetTag("http.route", "api/spaces/{spaceId}/accounts");
        activity.SetTag("http.response.status_code", 200);
        activity.SetTag("correlation_id", "00-trace-span-01");
        activity.SetTag("url.full", "https://example.test/api/spaces/6f9619ff/accounts?name=private");
        activity.SetTag("url.path", "/api/spaces/6f9619ff/accounts");
        activity.SetTag("client.address", "203.0.113.7");
        activity.SetTag("user_agent.original", "Mozilla/5.0");
        activity.SetTag("db.query.text", "select * from users where email = 'jane@example.test'");
        activity.SetTag("db.npgsql.data_source", "Host=localhost;Username=postgres;Database=kijk");
        activity.Stop();

        new TraceScrubbingProcessor().OnEnd(activity);

        var tags = activity.TagObjects.Select(tag => tag.Key).Order().ToArray();
        await Assert.That(tags).IsEquivalentTo(AllowedTags);
        await Assert.That(activity.Recorded).IsTrue();
    }

    [Test]
    public async Task AnErrorStatusKeepsItsCodeButLosesTheMessage()
    {
        using var listener = Listen();
        using var activity = Source.StartActivity("POST")!;
        activity.SetStatus(ActivityStatusCode.Error, "Key (email)=(jane@example.test) already exists");
        activity.Stop();

        new TraceScrubbingProcessor().OnEnd(activity);

        await Assert.That(activity.Status).IsEqualTo(ActivityStatusCode.Error);
        await Assert.That(activity.StatusDescription).IsNull();
    }

    [Test]
    public async Task ASpanWithAnExceptionEventIsNotExported()
    {
        using var listener = Listen();
        using var activity = Source.StartActivity("postgresql")!;
        activity.AddEvent(new ActivityEvent("exception", tags: new ActivityTagsCollection { ["exception.message"] = "relation \"users\" does not exist" }));
        activity.Stop();
        await Assert.That(activity.Recorded).IsTrue();

        new TraceScrubbingProcessor().OnEnd(activity);

        await Assert.That(activity.Recorded).IsFalse();
    }

    [Test]
    public async Task HarmlessEventsDoNotPreventTheExport()
    {
        using var listener = Listen();
        using var activity = Source.StartActivity("postgresql")!;
        activity.AddEvent(new ActivityEvent("received-first-response"));
        activity.Stop();

        new TraceScrubbingProcessor().OnEnd(activity);

        await Assert.That(activity.Recorded).IsTrue();
    }

    private static ActivityListener Listen()
    {
        var listener = new ActivityListener
        {
            ShouldListenTo = source => source.Name == SourceName,
            Sample = static (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded
        };
        ActivitySource.AddActivityListener(listener);
        return listener;
    }
}
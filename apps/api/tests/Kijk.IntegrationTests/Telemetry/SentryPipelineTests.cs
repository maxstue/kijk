using Kijk.Infrastructure;
using Kijk.Infrastructure.Telemetry;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Sentry;
using Sentry.AspNetCore;
using Sentry.Extensibility;
using Sentry.Protocol.Envelopes;

namespace Kijk.IntegrationTests.Telemetry;

// Runs the real Sentry SDK with the production scrubber and inspects what would be transmitted.
[NotInParallel("sentry")]
public class SentryPipelineTests
{
    private const string Secret = "jane@example.test";

    [Test]
    public async Task ProductionLoggingReportsStartupExceptionsAndIgnoresMessageOnlyErrors()
    {
        var transport = new CapturingTransport();
        var builder = WebApplication.CreateBuilder();
        builder.Configuration.Sources.Clear();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Sentry:Dsn"] = "https://publickey@o1.ingest.sentry.io/1",
        });
        builder.AddTelemetryTracking();
        builder.Services.AddInfrastructure(builder.Configuration);
        builder.Services.PostConfigure<SentryAspNetCoreOptions>(options => options.Transport = transport);
        await using var app = builder.Build();
        // This is the eager resolution in Program: no request has been made and no worker has started yet.
        var hub = app.Services.GetRequiredService<IHub>();
        var logger = app.Services.GetRequiredService<ILogger<SentryPipelineTests>>();

        logger.LogError(Thrown(), "Private context: {Email}", Secret);
        logger.LogError("This message has no exception");
        logger.LogWarning(new ArgumentException(Secret), "This is only a warning");
        await hub.FlushAsync(TimeSpan.FromSeconds(5));

        await Assert.That(transport.Count).IsEqualTo(1);
        var payload = await transport.SerializedAsync();
        await Assert.That(payload).Contains("InvalidOperationException");
        await Assert.That(payload).DoesNotContain("ArgumentException");
        await Assert.That(payload).DoesNotContain(Secret);
    }

    [Test]
    public async Task ACapturedExceptionLeavesTheProcessWithoutItsMessageOrContext()
    {
        var transport = new CapturingTransport();
        using (SentrySdk.Init(options =>
        {
            options.Dsn = "https://publickey@o1.ingest.sentry.io/1";
            options.Transport = transport;
            options.AutoSessionTracking = false;
            options.MaxBreadcrumbs = 0;
            options.SetBeforeSend(TelemetryEventScrubber.Scrub);
        }))
        {
            SentrySdk.CaptureException(Thrown(), scope =>
            {
                scope.SetTag("correlation_id", "00-abc-def-01");
                scope.SetTag("customer", Secret);
                scope.SetExtra("input", Secret);
                scope.User = new() { Email = Secret };
            });
            await SentrySdk.FlushAsync(TimeSpan.FromSeconds(5));
        }

        var payload = await transport.SerializedAsync();
        await Assert.That(payload).Contains("InvalidOperationException");
        await Assert.That(payload).Contains("[Filtered]");
        await Assert.That(payload).Contains("correlation_id");
        await Assert.That(payload).DoesNotContain(Secret);
        await Assert.That(payload).DoesNotContain("customer");
        await Assert.That(payload).DoesNotContain("context_line");
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

    private sealed class CapturingTransport : ITransport
    {
        private readonly List<Envelope> envelopes = [];

        public int Count => envelopes.Count;

        public Task SendEnvelopeAsync(Envelope envelope, CancellationToken cancellationToken = default)
        {
            lock (envelopes)
            {
                envelopes.Add(envelope);
            }

            return Task.CompletedTask;
        }

        public async Task<string> SerializedAsync()
        {
            using var stream = new MemoryStream();
            foreach (var envelope in envelopes.ToArray())
            {
                await envelope.SerializeAsync(stream, null);
            }

            return System.Text.Encoding.UTF8.GetString(stream.ToArray());
        }
    }
}
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Kijk.Application.Shared.Features;
using Kijk.Infrastructure.FeatureFlags;
using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Trace;

namespace Kijk.IntegrationTests.Telemetry;

// Runs the production telemetry registration with Sentry and PostHog configured; both point to a local recorder.
[NotInParallel]
public class TelemetryWiringTests
{
    private const string Secret = "jane@example.test";

    [Test]
    public async Task FeatureFlagsAreEvaluatedWithoutSendingUserDataOrTraceHeaders()
    {
        await using var recorder = Recorder.Start();
        await using var app = await StartAsync(recorder);
        using var source = new ActivitySource("Wolverine");
        using var request = source.StartActivity("request");

        var enabled = await app.Services.GetRequiredService<IFeatureFlags>().IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None);

        await Assert.That(enabled).IsTrue();
        var definitions = recorder.Requests.Single(item => item.Path == "/flags/definitions");
        await Assert.That(definitions.Query).IsEqualTo("?token=phc_test");
        await Assert.That(definitions.Headers["authorization"]).IsEqualTo("Bearer phs_test");
        await Assert.That(definitions.Headers.Keys).DoesNotContain("traceparent");
        await Assert.That(definitions.Headers.Keys).DoesNotContain("sentry-trace");
        await Assert.That(definitions.Headers.Keys).DoesNotContain("baggage");
        await Assert.That(definitions.Body).IsEmpty();
    }

    [Test]
    public async Task BothToolsReceiveOnlyScrubbedSpans()
    {
        await using var recorder = Recorder.Start();
        await using var app = await StartAsync(recorder);
        using (var source = new ActivitySource("Wolverine"))
        {
            using (var span = source.StartActivity("job"))
            {
                span?.SetTag("messaging.system", "wolverine-test");
                span?.SetTag("user.email", Secret);
            }

            // Exception events cannot be scrubbed; the exporters decide in OnEnd, so the scrubber has to drop the span first.
            using var failed = source.StartActivity("failed-job");
            failed?.AddException(new InvalidOperationException(Secret));
        }

        app.Services.GetRequiredService<TracerProvider>().ForceFlush();

        var exports = recorder.Requests.Where(item => item.Path.EndsWith("/v1/traces", StringComparison.Ordinal)).ToList();
        await Assert.That(exports.Select(item => item.Path)).IsEquivalentTo(["/i/v1/traces", "/api/2/integration/otlp/v1/traces"]);
        foreach (var export in exports)
        {
            await Assert.That(export.Body).Contains("wolverine-test").Because(export.Path);
            await Assert.That(export.Body).DoesNotContain(Secret).Because(export.Path);
            await Assert.That(export.Body).DoesNotContain("failed-job").Because(export.Path);
        }
    }

    private static async Task<WebApplication> StartAsync(Recorder recorder)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
        builder.Configuration.Sources.Clear();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Sentry:Dsn"] = new UriBuilder(recorder.BaseAddress) { UserName = "publickey", Path = "/2" }.Uri.ToString(),
            ["PostHog:ProjectToken"] = "phc_test",
            ["PostHog:HostUrl"] = recorder.BaseAddress.ToString(),
            ["FeatureFlags:SecretApiKey"] = "phs_test",
            ["Telemetry:TracesSampleRate"] = "1"
        });
        builder.WebHost.UseKestrel(options => options.Listen(IPAddress.Loopback, 0));
        builder.AddTelemetryTracking();
        builder.Services.AddOptions<TelemetryOptions>().Bind(builder.Configuration.GetSection(TelemetryOptions.SectionName));
        builder.Services.AddOptions<FeatureFlagsOptions>().Bind(builder.Configuration.GetSection(FeatureFlagsOptions.SectionName));
        builder.Services.AddTelemetry(builder.Configuration).AddFeatureFlags();

        var app = builder.Build();
        await app.StartAsync();
        return app;
    }

    /// <summary>Records every request sent to the configured telemetry hosts and answers it locally.</summary>
    private sealed class Recorder : IAsyncDisposable
    {
        private readonly HttpListener listener = new();
        private readonly Task loop;

        private Recorder(int port)
        {
            BaseAddress = new UriBuilder(Uri.UriSchemeHttp, IPAddress.Loopback.ToString(), port).Uri;
            listener.Prefixes.Add(BaseAddress.ToString());
            listener.Start();
            loop = Task.Run(ListenAsync);
        }

        public Uri BaseAddress { get; }

        public List<(string Path, string Query, Dictionary<string, string> Headers, string Body)> Requests { get; } = [];

        public static Recorder Start()
        {
            using var probe = new TcpListener(IPAddress.Loopback, 0);
            probe.Start();
            var port = ((IPEndPoint)probe.LocalEndpoint).Port;
            probe.Stop();
            return new(port);
        }

        public async ValueTask DisposeAsync()
        {
            listener.Stop();
            await loop.ConfigureAwait(ConfigureAwaitOptions.SuppressThrowing);
            listener.Close();
        }

        private async Task ListenAsync()
        {
            while (listener.IsListening)
            {
                var context = await listener.GetContextAsync();
                using var body = new MemoryStream();
                await context.Request.InputStream.CopyToAsync(body);
                var headers = context.Request.Headers.AllKeys.OfType<string>().ToDictionary(key => key.ToLowerInvariant(), key => context.Request.Headers[key] ?? string.Empty);
                lock (Requests)
                {
                    Requests.Add((context.Request.Url!.AbsolutePath, context.Request.Url.Query, headers, Encoding.UTF8.GetString(body.ToArray())));
                }

                var answer = context.Request.Url.AbsolutePath == "/flags/definitions"
                    ? """{ "flags": [{ "key": "finances", "active": true, "filters": { "groups": [{ "properties": [], "rollout_percentage": 100 }] } }] }"""
                    : "{}";
                context.Response.ContentType = "application/json";
                await context.Response.OutputStream.WriteAsync(Encoding.UTF8.GetBytes(answer));
                context.Response.Close();
            }
        }
    }
}
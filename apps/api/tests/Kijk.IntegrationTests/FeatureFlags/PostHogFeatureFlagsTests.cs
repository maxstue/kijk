using System.Net;
using System.Text;
using Kijk.Infrastructure.FeatureFlags;
using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Kijk.IntegrationTests.FeatureFlags;

public class PostHogFeatureFlagsTests
{
    private const string FinancesOnAiOff = """
        {
          "flags": [
            { "key": "finances", "active": true, "filters": { "groups": [{ "properties": [], "rollout_percentage": 100 }] } },
            { "key": "ai-import", "active": false, "filters": { "groups": [{ "properties": [], "rollout_percentage": 100 }] } }
          ]
        }
        """;

    [Test]
    public async Task EvaluatesLocallyAndSendsNoUserDataToPostHog()
    {
        var posthog = new FakeDefinitions(HttpStatusCode.OK, FinancesOnAiOff);
        var flags = Create(posthog);

        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsTrue();
        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.AiImport, CancellationToken.None)).IsFalse();

        var request = posthog.Requests.Single();
        await Assert.That(request.Method).IsEqualTo(HttpMethod.Get);
        await Assert.That(request.PathAndQuery).IsEqualTo("/flags/definitions?token=phc_test");
        await Assert.That(request.Authorization).IsEqualTo("Bearer phs_test");
        await Assert.That(request.Body).IsEmpty();
    }

    [Test]
    [Arguments(0, false)]
    [Arguments(100, true)]
    [Arguments(null, true)]
    public async Task GlobalSwitchesHaveTheSameValueForEveryCall(int? percentage, bool expected)
    {
        var value = percentage?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "null";
        var flags = Create(new FakeDefinitions(HttpStatusCode.OK, Flag("finances", $$"""[{ "properties": [], "rollout_percentage": {{value}} }]""")));
        for (var i = 0; i < 3; i++)
        {
            await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsEqualTo(expected);
        }
    }

    [Test]
    [Arguments(1)]
    [Arguments(50)]
    [Arguments(99)]
    public async Task PartialRolloutsStayOffEvenWhenTheOutageFallbackIsOn(int percentage)
    {
        var flags = Create(new FakeDefinitions(HttpStatusCode.OK, Flag("finances", $$"""[{ "properties": [], "rollout_percentage": {{percentage}} }]""")), new() { FinancesFallback = true });
        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsFalse();
    }

    [Test]
    public async Task DownloadsTheDefinitionsOncePerRefreshIntervalAndReusesUnchangedOnes()
    {
        var posthog = new FakeDefinitions(HttpStatusCode.OK, FinancesOnAiOff);
        var clock = new Clock();
        var flags = Create(posthog, clock: clock);

        await Task.WhenAll(Enumerable.Range(0, 5).Select(_ => flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)));
        await Assert.That(posthog.Requests).Count().IsEqualTo(1);

        posthog.Status = HttpStatusCode.NotModified;
        clock.Now += TimeSpan.FromMinutes(1);

        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsTrue();
        await Assert.That(posthog.Requests).Count().IsEqualTo(2);
        await Assert.That(posthog.Requests[1].IfNoneMatch).IsEqualTo("\"v1\"");
    }

    [Test]
    public async Task AFlagThatPostHogDoesNotKnowOrHasDeactivatedCountsAsOff()
    {
        var flags = Create(new FakeDefinitions(HttpStatusCode.OK, """{ "flags": [{ "key": "ai-import", "active": false, "filters": {} }] }"""));

        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsFalse();
        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.AiImport, CancellationToken.None)).IsFalse();
    }

    [Test]
    [Arguments("""[{ "properties": [{ "key": "email", "type": "person", "operator": "exact", "value": ["jane@example.test"] }], "rollout_percentage": 100 }]""")]
    [Arguments("""[{ "properties": [{ "key": "id", "type": "cohort", "value": 7 }], "rollout_percentage": null }]""")]
    public async Task TargetedFlagsStayOff(string groups)
    {
        // Both conditions would reach everyone if they were evaluated without their properties.
        var flags = Create(new FakeDefinitions(HttpStatusCode.OK, Flag("finances", groups)), new() { FinancesFallback = true });

        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsFalse();
    }

    [Test]
    [Arguments(true, """{ "aggregation_group_type_index": 0, "groups": [{ "rollout_percentage": 100 }] }""")]
    [Arguments(false, """{ "aggregation_group_type_index": 0, "groups": [{ "rollout_percentage": 100 }] }""")]
    [Arguments(true, """{ "multivariate": { "variants": [{ "key": "test", "rollout_percentage": 100 }] }, "groups": [{ "rollout_percentage": 100 }] }""")]
    public async Task GroupAndVariantFlagsStayOffIncludingWhenDeactivated(bool active, string filters)
    {
        var body = $$"""{ "flags": [{ "key": "finances", "active": {{(active ? "true" : "false")}}, "filters": {{filters}} }] }""";
        var flags = Create(new FakeDefinitions(HttpStatusCode.OK, body), new() { FinancesFallback = true });
        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsFalse();
    }

    [Test]
    [Arguments(HttpStatusCode.InternalServerError, "oops")]
    [Arguments(HttpStatusCode.Unauthorized, """{"type":"authentication_error"}""")]
    [Arguments(HttpStatusCode.OK, "not json")]
    [Arguments(HttpStatusCode.OK, """{ "flags": [], "quota_limited": ["feature_flags"] }""")]
    public async Task UsesTheConfiguredFallbackWhenPostHogCannotAnswer(HttpStatusCode status, string body)
    {
        var flags = Create(new FakeDefinitions(status, body), new() { FinancesFallback = true, AiImportFallback = false });

        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsTrue();
        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.AiImport, CancellationToken.None)).IsFalse();
    }

    [Test]
    public async Task UsesTheConfiguredFallbackWhilePostHogIsUnreachable()
    {
        var flags = Create(new FakeDefinitions(null, string.Empty), new() { FinancesFallback = false });

        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsFalse();
    }

    [Test]
    public async Task KeepsTheLastDefinitionsWhenADownloadFails()
    {
        var posthog = new FakeDefinitions(HttpStatusCode.OK, FinancesOnAiOff);
        var clock = new Clock();
        var flags = Create(posthog, new() { FinancesFallback = false }, clock);
        await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None);

        posthog.Status = null;
        clock.Now += TimeSpan.FromMinutes(1);

        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsTrue();
        await Assert.That(posthog.Requests).Count().IsEqualTo(2);
    }

    [Test]
    public async Task WithoutASecretKeyTheFallbackDecidesAndPostHogIsNotAsked()
    {
        var posthog = new FakeDefinitions(HttpStatusCode.OK, FinancesOnAiOff);
        var flags = Create(posthog, new() { AiImportFallback = true }, secretApiKey: null);

        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.AiImport, CancellationToken.None)).IsTrue();
        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.AiImport, CancellationToken.None)).IsTrue();
        await Assert.That(posthog.Requests).IsEmpty();
    }

    [Test]
    [Arguments(true, true)]
    [Arguments(false, false)]
    public async Task WithoutPostHogTheFallbackDecides(bool fallback, bool expected)
    {
        var posthog = new FakeDefinitions(HttpStatusCode.OK, FinancesOnAiOff);
        var flags = Create(posthog, new() { FinancesFallback = fallback, AiImportFallback = fallback }, projectToken: null);

        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.Finances, CancellationToken.None)).IsEqualTo(expected);
        await Assert.That(await flags.IsEnabledAsync(AppConstants.Features.AiImport, CancellationToken.None)).IsEqualTo(expected);
        await Assert.That(await flags.IsEnabledAsync("unknown", CancellationToken.None)).IsFalse();
        await Assert.That(posthog.Requests).IsEmpty();
    }

    private static string Flag(string key, string groups) =>
        $$"""{ "flags": [{ "key": "{{key}}", "active": true, "filters": { "groups": {{groups}} } }] }""";

    private static PostHogFeatureFlags Create(FakeDefinitions posthog, FeatureFlagsOptions? options = null, Clock? clock = null, string? secretApiKey = "phs_test", string? projectToken = "phc_test")
    {
        options ??= new();
        options.SecretApiKey = secretApiKey;
        return new(
            posthog,
            new(null, projectToken, new("https://posthog.example.test")),
            Options.Create(options),
            clock ?? new Clock(),
            NullLogger<PostHogFeatureFlags>.Instance);
    }

    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = DateTimeOffset.UnixEpoch;

        public override DateTimeOffset GetUtcNow() => Now;
    }

    /// <summary>Answers the definitions request locally; a <see langword="null" /> status makes PostHog unreachable.</summary>
    private sealed class FakeDefinitions(HttpStatusCode? status, string body) : HttpMessageHandler, IHttpClientFactory
    {
        public HttpStatusCode? Status { get; set; } = status;

        public List<(HttpMethod Method, string PathAndQuery, string? Authorization, string? IfNoneMatch, string Body)> Requests { get; } = [];

        public HttpClient CreateClient(string name) => new(this, disposeHandler: false);

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var content = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
            lock (Requests)
            {
                Requests.Add((request.Method, request.RequestUri!.PathAndQuery, request.Headers.Authorization?.ToString(), request.Headers.IfNoneMatch.FirstOrDefault()?.ToString(), content));
            }

            if (Status is not { } code)
            {
                throw new HttpRequestException("PostHog is unreachable");
            }

            var response = new HttpResponseMessage(code) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
            response.Headers.ETag = new("\"v1\"");
            return response;
        }
    }
}
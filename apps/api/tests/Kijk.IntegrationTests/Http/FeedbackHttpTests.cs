using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;

namespace Kijk.IntegrationTests.Http;

[NotInParallel]
public class FeedbackHttpTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task FeedbackWorksWithoutAnalyticsConsentAndOnlyReportsSuccessAfterDelivery()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var user = User.Init("feedback-auth", "member", "private@example.test");
        user.CompleteOnboarding("member", AnalyticsConsent.Declined, DateTime.UtcNow);
        dbContext.Add(user);
        await dbContext.SaveChangesAsync();
        var receiver = new FeedbackReceiver();
        await using var host = await SpaceApiHost.StartAsync(user.AuthId,
            configureServices: services => services.ConfigureAll<HttpClientFactoryOptions>(options =>
                options.HttpMessageHandlerBuilderActions.Add(builder => builder.PrimaryHandler = receiver)),
            configuration: new Dictionary<string, string?>
            {
                ["PostHog:ProjectToken"] = "phc_test",
                ["PostHog:HostUrl"] = "https://posthog.example.test",
                ["Telemetry:FeedbackSurveyId"] = "test-survey"
            });

        using var activity = new Activity("private-request").Start();
        using var response = await host.Client.PostAsJsonAsync("/api/users/me/feedback", new { message = " Please add a dark theme " });
        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.NoContent);
        using var body = JsonDocument.Parse(receiver.Body!);
        var properties = body.RootElement.GetProperty("properties");
        await Assert.That(body.RootElement.GetProperty("event").GetString()).IsEqualTo("survey sent");
        await Assert.That(properties.GetProperty("$survey_response").GetString()).IsEqualTo("Please add a dark theme");
        await Assert.That(properties.GetProperty("$survey_id").GetString()).IsEqualTo("test-survey");
        await Assert.That(properties.GetProperty("$process_person_profile").GetBoolean()).IsFalse();
        await Assert.That(receiver.Body!).DoesNotContain(user.Id.ToString());
        await Assert.That(receiver.Body!).DoesNotContain(user.AuthId);
        await Assert.That(receiver.Body!).DoesNotContain("private@example.test");
        await Assert.That(receiver.Headers.Any(header => header is "traceparent" or "sentry-trace" or "baggage" or "authorization")).IsFalse();
        var firstId = body.RootElement.GetProperty("distinct_id").GetString();

        receiver.Status = HttpStatusCode.ServiceUnavailable;
        using var failed = await host.Client.PostAsJsonAsync("/api/users/me/feedback", new { message = "Try again" });
        await Assert.That(failed.StatusCode).IsEqualTo(HttpStatusCode.ServiceUnavailable);
        using var secondBody = JsonDocument.Parse(receiver.Body ?? throw new InvalidOperationException("The receiver did not record a request"));
        await Assert.That(secondBody.RootElement.GetProperty("distinct_id").GetString()).IsNotEqualTo(firstId);

        var sent = receiver.Calls;
        foreach (var message in new string?[] { null, " ", new('a', 4001) })
        {
            using var invalid = await host.Client.PostAsJsonAsync("/api/users/me/feedback", new { message });
            await Assert.That(invalid.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        }
        await Assert.That(receiver.Calls).IsEqualTo(sent);

        using var anonymous = new HttpClient { BaseAddress = host.Client.BaseAddress };
        using var unauthorized = await anonymous.PostAsJsonAsync("/api/users/me/feedback", new { message = "Not signed in" });
        await Assert.That(unauthorized.StatusCode).IsEqualTo(HttpStatusCode.Unauthorized);
    }

    private sealed class FeedbackReceiver : HttpMessageHandler
    {
        public HttpStatusCode Status { get; set; } = HttpStatusCode.OK;
        public string? Body { get; private set; }
        public string[] Headers { get; private set; } = [];
        public int Calls { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            Body = request.Content is { } content ? await content.ReadAsStringAsync(cancellationToken) : string.Empty;
            Headers = request.Headers.Select(header => header.Key.ToLowerInvariant()).ToArray();
            return new(Status) { Content = new StringContent("{\"status\":1}") };
        }
    }
}
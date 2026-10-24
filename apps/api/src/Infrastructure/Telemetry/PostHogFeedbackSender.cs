using System.Net.Http.Json;
using Kijk.Application.Users.Feedback;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>Sends only the submitted message and a fresh random identifier, and awaits the receiver's response.</summary>
internal sealed class PostHogFeedbackSender(
    HttpClient httpClient,
    TelemetryDestinations destinations,
    IOptions<TelemetryOptions> options) : IFeedbackSender
{
    public async Task<bool> SendAsync(string message, CancellationToken cancellationToken)
    {
        if (!destinations.PostHog || string.IsNullOrWhiteSpace(options.Value.FeedbackSurveyId))
        {
            return false;
        }

        try
        {
            using var response = await httpClient.PostAsJsonAsync(new Uri(destinations.PostHogHost, "/i/v0/e/"), new
            {
                api_key = destinations.PostHogToken,
                distinct_id = Guid.NewGuid().ToString("N"),
                @event = "survey sent",
                properties = new Dictionary<string, object>
                {
                    ["$survey_id"] = options.Value.FeedbackSurveyId,
                    ["$survey_response"] = message.Trim(),
                    ["$process_person_profile"] = false,
                    ["$geoip_disable"] = true
                }
            }, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException)
        {
            return false;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
    }
}
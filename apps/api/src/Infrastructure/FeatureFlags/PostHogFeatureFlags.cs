using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Shared.Features;
using Kijk.Infrastructure.Telemetry;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure.FeatureFlags;

/// <summary>
/// Reads global on/off switches from PostHog definitions without sending user data. Only unconditional boolean
/// switches with 0% or 100% release conditions are supported. Targeting, variants and partial rollouts stay off.
/// Downloads are shared and cached; an outage uses the last definitions or configured fallbacks.
/// </summary>
internal sealed partial class PostHogFeatureFlags(
    IHttpClientFactory httpClientFactory,
    TelemetryDestinations destinations,
    IOptions<FeatureFlagsOptions> options,
    TimeProvider timeProvider,
    ILogger<PostHogFeatureFlags> logger) : IFeatureFlags
{
    /// <summary>The HTTP client for the definitions request, which carries no trace headers (see <c>FeatureFlagsDependencyInjection</c>).</summary>
    internal const string HttpClientName = "PostHogFeatureFlags";

    private static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan FailureRetry = TimeSpan.FromSeconds(15);

    private readonly Lock gate = new();
    private volatile IReadOnlyDictionary<string, bool>? rules;
    private string? etag;
    private DateTimeOffset nextRefresh = DateTimeOffset.MinValue;
    private Task? refreshing;

    /// <inheritdoc />
    public async Task<bool> IsEnabledAsync(string feature, CancellationToken cancellationToken)
    {
        if (!destinations.PostHog)
        {
            return options.Value.Fallback(feature);
        }

        await RefreshIfDueAsync(cancellationToken);
        if (rules is not { } current)
        {
            return options.Value.Fallback(feature);
        }

        // A flag that PostHog does not know, or that is deleted, counts as off.
        return current.GetValueOrDefault(feature);
    }

    private async Task RefreshIfDueAsync(CancellationToken cancellationToken)
    {
        Task refresh;
        lock (gate)
        {
            if (timeProvider.GetUtcNow() < nextRefresh)
            {
                return;
            }

            refreshing ??= Task.Run(RefreshAsync, CancellationToken.None);
            refresh = refreshing;
        }

        // Concurrent requests share one download, so PostHog is asked at most once per interval.
        await refresh.WaitAsync(cancellationToken);
    }

    private async Task RefreshAsync()
    {
        var next = FailureRetry;
        try
        {
            if (string.IsNullOrWhiteSpace(options.Value.SecretApiKey))
            {
                LogMissingKey(logger);
                next = TimeSpan.MaxValue;
                return;
            }

            await DownloadAsync();
            next = options.Value.RefreshInterval;
        }
        catch (Exception exception) when (exception is not OutOfMemoryException)
        {
            // Anything that goes wrong here must not take the application away: the last definitions, or else the
            // configured fallbacks, apply until the next attempt.
            LogDownloadFailed(logger, exception.GetType().Name);
        }
        finally
        {
            lock (gate)
            {
                nextRefresh = next == TimeSpan.MaxValue ? DateTimeOffset.MaxValue : timeProvider.GetUtcNow() + next;
                refreshing = null;
            }
        }
    }

    private async Task DownloadAsync()
    {
        using var timeout = new CancellationTokenSource(RequestTimeout);
        using var client = httpClientFactory.CreateClient(HttpClientName);
        using var request = new HttpRequestMessage(HttpMethod.Get, new Uri(destinations.PostHogHost, $"/flags/definitions?token={Uri.EscapeDataString(destinations.PostHogToken!)}"));
        request.Headers.Authorization = new("Bearer", options.Value.SecretApiKey);
        if (etag is not null && rules is not null)
        {
            request.Headers.IfNoneMatch.Add(EntityTagHeaderValue.Parse(etag));
        }

        using var response = await client.SendAsync(request, timeout.Token);
        if (response.StatusCode == HttpStatusCode.NotModified)
        {
            return;
        }

        response.EnsureSuccessStatusCode();
        var definitions = await response.Content.ReadFromJsonAsync<DefinitionsResponse>(timeout.Token);
        if (definitions?.Flags is null || definitions.QuotaLimited?.Contains("feature_flags") == true)
        {
            throw new InvalidOperationException("PostHog did not return usable flag definitions.");
        }

        rules = definitions.Flags.Where(flag => !flag.Deleted)
            .ToDictionary(flag => flag.Key, GlobalSwitch, StringComparer.Ordinal);
        etag = response.Headers.ETag?.ToString();
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "FeatureFlags__SecretApiKey is not configured; the configured feature flag fallbacks apply")]
    private static partial void LogMissingKey(ILogger logger);

    [LoggerMessage(Level = LogLevel.Warning, Message = "PostHog feature flag definitions could not be loaded ({Failure}); the last definitions or the configured fallbacks apply")]
    private static partial void LogDownloadFailed(ILogger logger, string failure);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Feature flag {Flag} is not a global boolean switch (0% or 100% without targeting); it stays off")]
    private static partial void LogUnsupportedConditions(ILogger logger, string flag);

    private bool GlobalSwitch(FlagDefinition flag)
    {
        if (!flag.Active)
        {
            return false;
        }

        var groups = flag.Filters?.Groups ?? [];
        if (flag.Filters?.AggregationGroupTypeIndex is not null
            || flag.Filters?.Multivariate is { ValueKind: not JsonValueKind.Null }
            || groups.Any(group => group.Properties is { Count: > 0 } || group.RolloutPercentage is not (null or 0 or 100)))
        {
            LogUnsupportedConditions(logger, flag.Key);
            return false;
        }

        return groups.Any(group => group.RolloutPercentage is null or 100);
    }

    private sealed record DefinitionsResponse(
        [property: JsonPropertyName("flags")] List<FlagDefinition>? Flags,
        [property: JsonPropertyName("quota_limited")] List<string>? QuotaLimited);

    private sealed record FlagDefinition(
        [property: JsonPropertyName("key")] string Key,
        [property: JsonPropertyName("active")] bool Active,
        [property: JsonPropertyName("deleted")] bool Deleted,
        [property: JsonPropertyName("filters")] FlagFilters? Filters);

    private sealed record FlagFilters(
        [property: JsonPropertyName("groups")] List<FlagCondition>? Groups,
        [property: JsonPropertyName("aggregation_group_type_index")] int? AggregationGroupTypeIndex,
        [property: JsonPropertyName("multivariate")] JsonElement? Multivariate);

    private sealed record FlagCondition(
        [property: JsonPropertyName("properties")] List<JsonElement>? Properties,
        [property: JsonPropertyName("rollout_percentage")] double? RolloutPercentage);
}
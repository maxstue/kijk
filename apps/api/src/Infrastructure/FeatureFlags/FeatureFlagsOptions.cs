using System.ComponentModel.DataAnnotations;
using Kijk.Infrastructure.Configuration;
using Kijk.Shared;

namespace Kijk.Infrastructure.FeatureFlags;

/// <summary>
/// Settings of the PostHog feature flags that switch the finance area and the AI import. PostHog itself is configured by
/// <c>PostHog__ProjectToken</c> and <c>PostHog__HostUrl</c>; the flags are evaluated in the API, so PostHog only provides
/// their definitions.
/// </summary>
public sealed class FeatureFlagsOptions
{
    /// <summary>Gets the configuration section name.</summary>
    public static string SectionName => "FeatureFlags";

    /// <summary>
    /// Gets or sets whether the finance area is available while PostHog is not configured, cannot be reached. A missing, deactivated or unsupported flag counts as off.
    /// </summary>
    public bool FinancesFallback { get; set; } = true;

    /// <summary>
    /// Gets or sets whether the AI import is available while PostHog is not configured or cannot be reached. The
    /// server-side AI kill switch (<c>Ai__Enabled</c>) applies in addition.
    /// </summary>
    public bool AiImportFallback { get; set; } = true;

    /// <summary>
    /// Gets or sets the project secret API key with the <c>feature_flag:read</c> scope that downloads the flag
    /// definitions. Without it the fallbacks apply. It is a secret and never leaves the API.
    /// </summary>
    public string? SecretApiKey { get; set; }

    /// <summary>
    /// Gets or sets how long the flag definitions are used before they are downloaded again, so a change in PostHog takes
    /// up to this long to apply. PostHog bills an unchanged download as one flag request and a changed one as ten.
    /// </summary>
    [PositiveTimeSpan]
    public TimeSpan RefreshInterval { get; set; } = TimeSpan.FromMinutes(1);

    /// <summary>Gets the fallback for a feature.</summary>
    /// <param name="feature">The feature key.</param>
    /// <returns>The fallback; unknown features are off.</returns>
    public bool Fallback(string feature) => feature switch
    {
        AppConstants.Features.Finances => FinancesFallback,
        AppConstants.Features.AiImport => AiImportFallback,
        _ => false
    };
}
using Kijk.Shared;

namespace Kijk.Application.Users.Shared;

/// <summary>The current user's account settings.</summary>
/// <param name="Id">The user id.</param>
/// <param name="AuthId">The authentication provider's user id.</param>
/// <param name="Name">The display name.</param>
/// <param name="Email">The email address.</param>
/// <param name="UseDefaultResources">Whether the system default resources are enabled.</param>
/// <param name="AnalyticsConsent">The analytics preference.</param>
/// <param name="AnalyticsConsentUpdatedAt">When the analytics preference last changed.</param>
/// <param name="OnboardingCompletedAt">When onboarding was completed.</param>
public record UserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? UseDefaultResources,
    AnalyticsConsent? AnalyticsConsent,
    DateTime? AnalyticsConsentUpdatedAt,
    DateTime? OnboardingCompletedAt)
{
    /// <summary>
    /// Gets whether the user has completed onboarding.
    /// </summary>
    public bool OnboardingCompleted => OnboardingCompletedAt.HasValue;
}
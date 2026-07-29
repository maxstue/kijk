using Kijk.Shared;

namespace Kijk.Application.Users.Shared;

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
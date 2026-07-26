using Kijk.Shared;

namespace Kijk.Application.Users.Shared;

public record UserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    bool? UseDefaultResources,
    AnalyticsConsent? AnalyticsConsent,
    DateTime? AnalyticsConsentUpdatedAt,
    int? OnboardingVersion,
    DateTime? OnboardingCompletedAt);
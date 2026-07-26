using Kijk.Shared;

namespace Kijk.Application.Users.Welcome;

/// <summary>
/// Completes the setup of a newly registered user.
/// </summary>
/// <param name="DisplayName">The display name used by Kijk.</param>
/// <param name="HouseholdName">The name of the user's active household.</param>
/// <param name="UseDefaultResources">Whether all system default resources should be enabled.</param>
/// <param name="AnalyticsConsent">The user's explicit analytics preference.</param>
public record WelcomeUserRequest(
    string DisplayName,
    string HouseholdName,
    bool UseDefaultResources,
    AnalyticsConsent AnalyticsConsent);
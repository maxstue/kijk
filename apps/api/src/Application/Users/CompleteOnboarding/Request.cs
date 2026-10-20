using Kijk.Shared;

namespace Kijk.Application.Users.CompleteOnboarding;

/// <summary>
/// Completes the setup of a newly registered user.
/// </summary>
/// <param name="DisplayName">The display name used by Kijk.</param>
/// <param name="SpaceName">The name of the first space, which the user can share with others.</param>
/// <param name="UseDefaultResources">Whether all system default resources should be enabled.</param>
/// <param name="UseExternalProfile">Whether Kijk may use the Clerk-managed full name and profile image.</param>
/// <param name="AnalyticsConsent">The user's explicit analytics preference.</param>
public record WelcomeUserRequest(
    string DisplayName,
    string SpaceName,
    bool UseDefaultResources,
    bool UseExternalProfile,
    AnalyticsConsent AnalyticsConsent);
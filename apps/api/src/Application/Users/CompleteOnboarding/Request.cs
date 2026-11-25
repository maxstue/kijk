using Kijk.Shared;

namespace Kijk.Application.Users.CompleteOnboarding;

/// <summary>
/// Completes the setup of a newly registered user.
/// </summary>
/// <param name="DisplayName">The display name used by Kijk.</param>
/// <param name="SpaceName">
/// The name of the user's personal space, which is never shared. Defaults to "Personal" when omitted. Shared spaces
/// are created after onboarding.
/// </param>
/// <param name="UseDefaultResources">Whether all system default resources should be enabled.</param>
/// <param name="UseExternalProfile">Whether Kijk may use the Clerk-managed full name and profile image.</param>
/// <param name="AnalyticsConsent">The user's explicit analytics preference.</param>
/// <param name="InvitationToken">
/// The token of an invitation to accept. The user then also joins the invited space, which becomes the space the app
/// opens first. An invalid invitation fails the onboarding without creating the account.
/// </param>
public record WelcomeUserRequest(
    string DisplayName,
    string? SpaceName,
    bool UseDefaultResources,
    bool UseExternalProfile,
    AnalyticsConsent AnalyticsConsent,
    string? InvitationToken = null);
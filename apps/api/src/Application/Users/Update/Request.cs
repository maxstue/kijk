using Kijk.Shared;

namespace Kijk.Application.Users.Update;

/// <summary>Changes to the current user; <see langword="null" /> values are left unchanged.</summary>
/// <param name="UserName">The new display name.</param>
/// <param name="UseDefaultResources">Whether the system default resources should be enabled.</param>
/// <param name="UseExternalProfile">Whether Kijk may use the name and image from the authentication provider.</param>
/// <param name="HouseholdName">The new name of the active household.</param>
/// <param name="AnalyticsConsent">The new analytics preference.</param>
/// <param name="AiEnabled">Whether AI features are allowed for the user.</param>
public record UpdateUserRequest(
    string? UserName,
    bool? UseDefaultResources,
    bool? UseExternalProfile,
    string? HouseholdName,
    AnalyticsConsent? AnalyticsConsent,
    bool? AiEnabled = null);
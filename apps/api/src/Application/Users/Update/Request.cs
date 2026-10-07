using Kijk.Shared;

namespace Kijk.Application.Users.Update;

/// <summary>Changes to the current user; <see langword="null" /> values are left unchanged.</summary>
/// <param name="UserName">The new display name.</param>
/// <param name="UseDefaultResources">Whether the system default resources should be enabled.</param>
/// <param name="UseExternalProfile">Whether Kijk may use the name and image from the authentication provider.</param>
/// <param name="SpaceName">The new name of the active space.</param>
/// <param name="AnalyticsConsent">The new analytics preference.</param>
/// <param name="AiEnabled">Whether AI features are allowed for the user.</param>
/// <param name="SensitiveDataConsent">Whether the user consents to processing bank transactions that may reveal sensitive data.</param>
public record UpdateUserRequest(
    string? UserName,
    bool? UseDefaultResources,
    bool? UseExternalProfile,
    string? SpaceName,
    AnalyticsConsent? AnalyticsConsent,
    bool? AiEnabled = null,
    bool? SensitiveDataConsent = null);
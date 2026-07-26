using Kijk.Shared;

namespace Kijk.Application.Users.GetMe;

public record GetMeUserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    AnalyticsConsent? AnalyticsConsent,
    DateTime? AnalyticsConsentUpdatedAt,
    int? OnboardingVersion,
    DateTime? OnboardingCompletedAt,
    IEnumerable<UserHouseholdResponse>? Households,
    IEnumerable<UserResourceResponse>? Resources)
{
    /// <summary>
    /// Gets whether Kijk may use the external full name and profile image.
    /// </summary>
    public bool? UseExternalProfile { get; init; }

    /// <summary>
    /// Gets identity data supplied by the authentication provider.
    /// </summary>
    public ExternalIdentityResponse? ExternalIdentity { get; init; }
}

/// <summary>
/// Identity data owned by the authentication provider and exposed according to the user's preference.
/// </summary>
/// <param name="FullName">The full name, or null when its use is disabled.</param>
/// <param name="Email">The primary sign-in email address.</param>
/// <param name="ImageUrl">The profile image URL, or null when its use is disabled.</param>
/// <param name="Provider">The primary sign-in provider.</param>
public record ExternalIdentityResponse(string? FullName, string? Email, string? ImageUrl, string Provider);

public record UserHouseholdResponse(Guid Id, string Name, string? Description, UserHouseholdRoleResponse Role, bool IsActive);

public record UserHouseholdRoleResponse(Guid Id, string Name, IList<string> Permissions);

public record UserResourceResponse(Guid Id, string Name, string Unit, string Color, CreatorType CreatorType);
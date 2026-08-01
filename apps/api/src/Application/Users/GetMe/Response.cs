using Kijk.Shared;

namespace Kijk.Application.Users.GetMe;

/// <summary>
/// Describes the account state for the authenticated Clerk identity.
/// </summary>
public enum CurrentUserStatus
{
    /// <summary>The identity must complete onboarding before it can use Kijk.</summary>
    OnboardingRequired,

    /// <summary>The identity has a complete Kijk user and can use the application.</summary>
    Ready,
}

/// <summary>
/// Represents the current account while preventing invalid account-state combinations.
/// </summary>
public sealed record CurrentUserResponse
{
    private CurrentUserResponse(CurrentUserStatus status, GetMeUserResponse? user, ExternalIdentityResponse identity)
    {
        Status = status;
        User = user;
        Identity = identity;
    }

    /// <summary>Gets the current account state.</summary>
    public CurrentUserStatus Status { get; }

    /// <summary>Gets the persisted Kijk user when the account is ready.</summary>
    public GetMeUserResponse? User { get; }

    /// <summary>Gets the authenticated provider identity.</summary>
    public ExternalIdentityResponse Identity { get; }

    /// <summary>Creates an onboarding-required response.</summary>
    public static CurrentUserResponse OnboardingRequired(ExternalIdentityResponse identity) => new(CurrentUserStatus.OnboardingRequired, null, identity);

    /// <summary>Creates a ready response.</summary>
    public static CurrentUserResponse Ready(GetMeUserResponse user, ExternalIdentityResponse identity) => new(CurrentUserStatus.Ready, user, identity);
}

/// <summary>
/// Represents the persisted Kijk user data for a ready account.
/// </summary>
public record GetMeUserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    AnalyticsConsent? AnalyticsConsent,
    DateTime? AnalyticsConsentUpdatedAt,
    DateTime? OnboardingCompletedAt,
    IEnumerable<UserHouseholdResponse>? Households,
    IEnumerable<UserResourceResponse>? Resources)
{
    /// <summary>
    /// Gets whether the user has completed onboarding.
    /// </summary>
    public bool OnboardingCompleted => OnboardingCompletedAt.HasValue;

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
public record ExternalIdentityResponse(string? FullName, string? Email, string? ImageUrl);

public record UserHouseholdResponse(Guid Id, string Name, string? Description, UserHouseholdRoleResponse Role, bool IsActive);

public record UserHouseholdRoleResponse(Guid Id, string Name, IList<string> Permissions);

public record UserResourceResponse(Guid Id, string Name, string Unit, string Color, CreatorType CreatorType);

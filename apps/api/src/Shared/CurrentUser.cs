using System.Security.Claims;
using Kijk.Shared.Exceptions;

namespace Kijk.Shared;

public class CurrentUser
{
    public ClaimsPrincipal? Principal { get; set; }

    public SimpleAuthUser? User { get; set; }

    /// <summary>
    /// Gets whether the authenticated identity has completed Kijk onboarding.
    /// </summary>
    public bool IsReady => User?.OnboardingCompleted is true;

    public Guid Id => User?.Id ?? throw new NullException("Kijk user not found");

    public string AuthId => Principal?.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new NullException("'AuthId' not found");

    public string Name => User?.Name ?? throw new NullException("'Name' not found");

    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);

    public Guid? ActiveHouseholdId => User?.HouseholdId;

    /// <summary>
    /// Gets the user's role in the active household, or <see langword="null"/> when there is no active household.
    /// </summary>
    public string? HouseholdRole => User?.HouseholdRole;

    /// <summary>
    /// Gets the permissions the user's role grants in the active household.
    /// </summary>
    public IReadOnlyCollection<string> HouseholdPermissions => User?.HouseholdPermissions ?? [];

    /// <summary>
    /// Determines whether the user's role grants the given permission in the active household.
    /// </summary>
    /// <param name="permission">The permission name.</param>
    /// <returns><see langword="true"/> when the permission is granted.</returns>
    public bool HasHouseholdPermission(string permission) =>
        HouseholdPermissions.Contains(permission, StringComparer.Ordinal);
}

/// <summary>
/// The persisted user data resolved once per request.
/// </summary>
/// <param name="Id">The Kijk user id.</param>
/// <param name="AuthId">The authentication provider's user id.</param>
/// <param name="HouseholdId">The active household id.</param>
/// <param name="Name">The display name.</param>
/// <param name="Email">The email address.</param>
/// <param name="OnboardingCompleted">Whether onboarding is completed.</param>
public record SimpleAuthUser(Guid Id, string AuthId, Guid? HouseholdId, string Name, string? Email, bool OnboardingCompleted)
{
    /// <summary>
    /// Gets the user's role name in the active household.
    /// </summary>
    public string? HouseholdRole { get; init; }

    /// <summary>
    /// Gets the permissions the user's role grants in the active household.
    /// </summary>
    public IReadOnlyCollection<string> HouseholdPermissions { get; init; } = [];
}
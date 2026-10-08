using System.Security.Claims;
using Kijk.Shared.Exceptions;

namespace Kijk.Shared;

/// <summary>The authenticated user of the current request. Resolved once per request by the current-user middleware.</summary>
public class CurrentUser
{
    /// <summary>Gets or sets the authenticated principal from the access token.</summary>
    public ClaimsPrincipal? Principal { get; set; }

    /// <summary>Gets or sets the persisted Kijk user, or <see langword="null" /> before the account exists.</summary>
    public SimpleAuthUser? User { get; set; }

    /// <summary>
    /// Gets whether the authenticated identity has completed Kijk onboarding.
    /// </summary>
    public bool IsReady => User?.OnboardingCompleted is true;

    /// <summary>Gets the Kijk user id.</summary>
    /// <exception cref="NullException">The Kijk user does not exist yet.</exception>
    public Guid Id => User?.Id ?? throw new NullException("Kijk user not found");

    /// <summary>Gets the authentication provider's user id from the token.</summary>
    /// <exception cref="NullException">The token has no user id.</exception>
    public string AuthId => Principal?.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new NullException("'AuthId' not found");

    /// <summary>Gets the display name.</summary>
    /// <exception cref="NullException">The Kijk user does not exist yet.</exception>
    public string Name => User?.Name ?? throw new NullException("'Name' not found");

    /// <summary>Gets the email address from the token, if present.</summary>
    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);

    /// <summary>Gets the active household id, or <see langword="null" /> without an active household.</summary>
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
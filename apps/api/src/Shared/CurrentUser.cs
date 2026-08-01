using System.Security.Claims;
using Kijk.Shared.Exceptions;

namespace Kijk.Shared;

public class CurrentUser
{
    private const string PermissionsClaim = "permissions";

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

    public IEnumerable<string> Permissions => Principal?.FindAll(PermissionsClaim).Select(x => x.Value) ?? [];

    public bool IsAdmin => Permissions.Contains(AppConstants.Roles.Admin);

    public bool IsUser => Permissions.Contains(AppConstants.Roles.User);

    public Guid? ActiveHouseholdId => User?.HouseholdId;
}

public record SimpleAuthUser(Guid Id, string AuthId, Guid? HouseholdId, string Name, string? Email, bool OnboardingCompleted);
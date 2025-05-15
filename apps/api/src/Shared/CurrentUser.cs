using System.Security.Claims;
using Kijk.Shared.Exceptions;

namespace Kijk.Shared;

public class CurrentUser
{
    private const string PermissionsClaim = "permissions";

    public required ClaimsPrincipal Principal { get; set; }

    public required SimpleAuthUser User { get; set; }

    public Guid Id => User.Id;

    public string AuthId => User.AuthId ?? throw new NullException("'AuthId' not found");

    public string Name => User.Name ?? throw new NullException("'Name' not found");

    public string Email => User.Email ?? throw new NullException("'Upn/Email' not found");

    public IEnumerable<string> Permissions => Principal.FindAll(PermissionsClaim).Select(x => x.Value);

    public bool IsAdmin => Permissions.Contains(AppConstants.Roles.Admin);

    public bool IsUser => Permissions.Contains(AppConstants.Roles.Admin);

    public Guid? ActiveHouseholdId => User.HouseholdId;
}

public record SimpleAuthUser(Guid Id, string AuthId, Guid? HouseholdId, string Name, string? Email, bool? FirstTime = false);
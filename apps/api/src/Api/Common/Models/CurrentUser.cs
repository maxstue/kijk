using System.Security.Claims;

using Kijk.Api.Common.Exceptions;

namespace Kijk.Api.Common.Models;

public class CurrentUser
{
    private const string PermissionsClaim = "permissions";

    public required ClaimsPrincipal Principal { get; set; }

    public required SimpleAuthUser User { get; set; }

    public Guid Id => this.User.Id;

    public string AuthId => this.User.AuthId ?? throw new NullException("'AuthId' not found");

    public string Name => this.User.Name ?? throw new NullException("'Name' not found");

    public string Email => this.User.Email ?? throw new NullException("'Upn/Email' not found");

    public IEnumerable<string> Permissions => Principal.FindAll(PermissionsClaim).Select(x => x.Value);

    public bool IsAdmin => this.Permissions.Contains(AppConstants.Roles.Admin);

    public bool IsUser => this.Permissions.Contains(AppConstants.Roles.Admin);

    public Guid ActiveHouseholdId => this.User.HouseholdId;
}
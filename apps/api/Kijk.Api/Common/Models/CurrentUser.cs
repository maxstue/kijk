using System.Security.Claims;

namespace Kijk.Api.Common.Models;

public class CurrentUser
{
    private const string NameClaim = "name";
    private const string PermissionsClaim = "permissions";

    public required ClaimsPrincipal Principal { get; set; }

    public string Id => Principal.FindFirstValue(ClaimTypes.NameIdentifier) ??
                        throw new ArgumentNullException(ClaimTypes.NameIdentifier, "'NameIdentifier' not found");

    public string Name => Principal.FindFirstValue(NameClaim) ?? throw new ArgumentNullException(NameClaim, "'Name' not found");

    public string Email => Principal.FindFirstValue(ClaimTypes.Upn) ?? throw new ArgumentNullException(ClaimTypes.Upn, "'Upn/Email' not found");

    public string Role => Principal.FindFirstValue(ClaimTypes.Role) ?? throw new ArgumentNullException(ClaimTypes.Role, "'Role' not found");

    public List<string> Permissions =>
        Principal.FindAll(PermissionsClaim).Select(x => x.Value).ToList() ??
        throw new ArgumentNullException(PermissionsClaim, "'Permissions' not found");

    public bool IsAdmin => Principal.IsInRole(AppConstants.Roles.Admin);

    public bool IsUser => Principal.IsInRole(AppConstants.Roles.User);
}

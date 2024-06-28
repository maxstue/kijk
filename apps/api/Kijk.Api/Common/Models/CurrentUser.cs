using System.Security.Claims;
using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Common.Models;

public class CurrentUser
{
    private const string PermissionsClaim = "permissions";

    public required ClaimsPrincipal Principal { get; set; }

    public required SimpleAuthUser User { get; set; }

    public Guid Id => this.User.Id;

    public string AuthId => this.User.AuthId ?? throw new ArgumentNullException(this.User.AuthId, "'AuthId' not found");

    public string Name => this.User.Name ?? throw new ArgumentNullException(this.User.Name, "'Name' not found");

    public string Email => this.User.Email ?? throw new ArgumentNullException(ClaimTypes.Upn, "'Upn/Email' not found");

    public List<string> Permissions => Principal.FindAll(PermissionsClaim).Select(x => x.Value).ToList();

    public bool IsAdmin => this.Permissions.Contains(AppConstants.Roles.Admin);

    public bool IsUser => this.Permissions.Contains(AppConstants.Roles.Admin);
}

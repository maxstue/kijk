using Microsoft.AspNetCore.Authorization;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Requires the current user's role to grant a permission in the active household.
/// </summary>
/// <param name="permission">The required permission name.</param>
public sealed class HouseholdPermissionRequirement(string permission) : IAuthorizationRequirement
{
    /// <summary>
    /// Gets the required permission name.
    /// </summary>
    public string Permission { get; } = permission;
}
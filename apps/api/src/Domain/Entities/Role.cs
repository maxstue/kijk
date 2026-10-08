namespace Kijk.Domain.Entities;

/// <summary>
/// A household role that bundles permissions. Roles are seeded from <see cref="Authorization.HouseholdRoles"/>.
/// </summary>
public class Role : BaseEntity
{
    /// <summary>Gets the role name.</summary>
    public required string Name { get; init; }

    /// <summary>Gets or sets the permissions granted by the role.</summary>
    public required ICollection<Permission> Permissions { get; set; } = [];
    /// <summary>Gets or sets the memberships that have this role.</summary>
    public ICollection<UserHousehold>? UserHouseholds { get; set; } = [];

    /// <summary>
    /// Determines whether the role grants the given permission.
    /// </summary>
    /// <param name="permission">The permission name.</param>
    /// <returns><see langword="true"/> when the role grants the permission.</returns>
    public bool HasPermission(string permission) =>
        Permissions.Any(item => string.Equals(item.Name, permission, StringComparison.Ordinal));
}
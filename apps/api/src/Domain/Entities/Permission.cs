namespace Kijk.Domain.Entities;

/// <summary>
/// A permission granted by space roles. Permissions are seeded from <see cref="Authorization.SpacePermissions"/>.
/// </summary>
public class Permission : BaseEntity
{
    /// <summary>Gets the permission name in the form <c>area:verb</c>.</summary>
    public required string Name { get; init; }

    /// <summary>Gets the roles granting this permission.</summary>
    public required ICollection<Role> Roles { get; init; } = new List<Role>();
}
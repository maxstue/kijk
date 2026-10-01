namespace Kijk.Domain.Entities;

/// <summary>
/// A permission granted by household roles. Permissions are seeded from <see cref="Authorization.HouseholdPermissions"/>.
/// </summary>
public class Permission : BaseEntity
{
    public required string Name { get; init; }

    public required ICollection<Role> Roles { get; init; } = new List<Role>();
}
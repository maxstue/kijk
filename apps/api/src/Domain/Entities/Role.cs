namespace Kijk.Domain.Entities;

public class Role : BaseEntity
{
    public required string Name { get; set; }

    public required List<Permission> Permissions { get; set; }
    public List<UserHousehold>? UserHouseholds { get; set; } = [];
}
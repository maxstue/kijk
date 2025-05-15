namespace Kijk.Domain.Entities;

public class Permission : BaseEntity
{
    public required string Name { get; set; }

    public required List<Role> Roles { get; set; }
    public List<UserHousehold>? UserHouseholds { get; set; } = [];
}
namespace Kijk.Domain.Entities;

public class Role : BaseEntity
{
    public required string Name { get; init; }

    public required ICollection<Permission> Permissions { get; set; } = [];
    public ICollection<UserHousehold>? UserHouseholds { get; set; } = [];
}
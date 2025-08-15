namespace Kijk.Domain.Entities;

public class Role : BaseEntity
{
    public required string Name { get; init; }

    public required IEnumerable<Permission> Permissions { get; set; } = [];
    public IEnumerable<UserHousehold>? UserHouseholds { get; set; } = [];
}
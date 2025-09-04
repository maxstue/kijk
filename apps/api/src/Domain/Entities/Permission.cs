namespace Kijk.Domain.Entities;

public class Permission : BaseEntity
{
    public required string Name { get; init; }

    public required IEnumerable<Role> Roles { get; init; } = [];
    public IEnumerable<UserHousehold>? UserHouseholds { get; set; } = [];
}
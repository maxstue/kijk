namespace Kijk.Domain.Entities;

public class Permission : BaseEntity
{
    public required string Name { get; init; }

    public required ICollection<Role> Roles { get; init; } = new List<Role>();
    public ICollection<UserHousehold>? UserHouseholds { get; set; } = new List<UserHousehold>();
}
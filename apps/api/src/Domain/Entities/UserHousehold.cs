namespace Kijk.Domain.Entities;

public sealed class UserHousehold : BaseEntity
{
    public Guid UserId { get; set; }
    public required User User { get; set; }

    public Guid HouseholdId { get; set; }
    public required Household Household { get; set; }

    public Guid RoleId { get; set; }
    public required Role Role { get; set; }

    /// <summary>
    /// A list of extra permissions that the user has in the household.
    /// </summary>
    public List<Permission>? UserHouseHoldExtraPermissions { get; set; } = [];

    /// <summary>
    /// A boolean which represents if the household is active or not.
    /// </summary>
    public bool IsActive { get; set; }

    public static UserHousehold Create(User user, Household household, Role role, bool isActive = false) =>
        new()
        {
            Id = Guid.CreateVersion7(),
            User = user,
            Household = household,
            Role = role,
            IsActive = isActive,
        };
}
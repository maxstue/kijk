namespace Kijk.Domain.Entities;

public sealed class UserHousehold : BaseEntity
{
    public Guid UserId { get; init; }
    public required User User { get; init; }

    public Guid HouseholdId { get; init; }
    public required Household Household { get; init; }

    public Guid RoleId { get; init; }
    public required Role Role { get; init; }

    /// <summary>
    /// A list of extra permissions that the user has in the household.
    /// </summary>
    public List<Permission>? UserHouseHoldExtraPermissions { get; init; } = [];

    /// <summary>
    /// A boolean which represents if the household is active or not.
    /// </summary>
    public bool IsActive { get; init; }

    public static UserHousehold Create(User user, Household household, Role role, bool isActive = false) =>
        new()
        {
            User = user,
            Household = household,
            Role = role,
            IsActive = isActive,
        };
}
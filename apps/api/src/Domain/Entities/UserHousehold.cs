namespace Kijk.Domain.Entities;

public sealed class UserHousehold : BaseEntity
{
    public Guid UserId { get; init; }
    public required User User { get; init; }

    public Guid HouseholdId { get; init; }
    public required Household Household { get; init; }

    public Guid RoleId { get; init; }

    /// <summary>
    /// The role of the user in the household. It defines the user's permissions in the household.
    /// Use <see cref="ChangeRole"/> to change it.
    /// </summary>
    public required Role Role { get; set; }

    /// <summary>
    /// A boolean which represents if the household is active or not.
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Sets whether this is the user's active household.
    /// </summary>
    /// <param name="isActive">Whether this household should be active.</param>
    public void SetActive(bool isActive) => IsActive = isActive;

    /// <summary>
    /// Changes the role of the user in the household.
    /// </summary>
    /// <param name="role">The new role.</param>
    public void ChangeRole(Role role)
    {
        ArgumentNullException.ThrowIfNull(role);
        Role = role;
    }

    public static UserHousehold Create(User user, Household household, Role role, bool isActive = false) =>
        new()
        {
            User = user,
            Household = household,
            Role = role,
            IsActive = isActive,
        };
}
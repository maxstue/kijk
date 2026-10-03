namespace Kijk.Domain.Entities;

/// <summary>A user's membership in a household, including the user's role there.</summary>
public sealed class UserHousehold : BaseEntity
{
    /// <summary>Gets the id of <see cref="User" />.</summary>
    public Guid UserId { get; init; }
    /// <summary>Gets the member.</summary>
    public required User User { get; init; }

    /// <summary>Gets the id of <see cref="Household" />.</summary>
    public Guid HouseholdId { get; init; }
    /// <summary>Gets the household.</summary>
    public required Household Household { get; init; }

    /// <summary>Gets the id of <see cref="Role" />.</summary>
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

    /// <summary>Creates a membership.</summary>
    /// <param name="user">The member.</param>
    /// <param name="household">The household.</param>
    /// <param name="role">The member's role.</param>
    /// <param name="isActive">Whether this becomes the user's active household.</param>
    /// <returns>The new membership.</returns>
    public static UserHousehold Create(User user, Household household, Role role, bool isActive = false) =>
        new()
        {
            User = user,
            Household = household,
            Role = role,
            IsActive = isActive,
        };
}
namespace Kijk.Domain.Entities;

/// <summary>A user's membership in a space, including the user's role there.</summary>
public sealed class UserSpace : BaseEntity
{
    /// <summary>Gets the id of <see cref="User" />.</summary>
    public Guid UserId { get; init; }
    /// <summary>Gets the member.</summary>
    public required User User { get; init; }

    /// <summary>Gets the id of <see cref="Space" />.</summary>
    public Guid SpaceId { get; init; }
    /// <summary>Gets the space.</summary>
    public required Space Space { get; init; }

    /// <summary>Gets the id of <see cref="Role" />.</summary>
    public Guid RoleId { get; init; }

    /// <summary>
    /// The role of the user in the space. It defines the user's permissions in the space.
    /// Use <see cref="ChangeRole"/> to change it.
    /// </summary>
    public required Role Role { get; set; }

    /// <summary>
    /// A boolean which represents if the space is active or not.
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Sets whether this is the user's active space.
    /// </summary>
    /// <param name="isActive">Whether this space should be active.</param>
    public void SetActive(bool isActive) => IsActive = isActive;

    /// <summary>
    /// Changes the role of the user in the space.
    /// </summary>
    /// <param name="role">The new role.</param>
    public void ChangeRole(Role role)
    {
        ArgumentNullException.ThrowIfNull(role);
        Role = role;
    }

    /// <summary>Creates a membership.</summary>
    /// <param name="user">The member.</param>
    /// <param name="space">The space.</param>
    /// <param name="role">The member's role.</param>
    /// <param name="isActive">Whether this becomes the user's active space.</param>
    /// <returns>The new membership.</returns>
    public static UserSpace Create(User user, Space space, Role role, bool isActive = false) =>
        new()
        {
            User = user,
            Space = space,
            Role = role,
            IsActive = isActive,
        };
}
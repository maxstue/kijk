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
    /// Gets whether the user chose this space as the one the app opens first. A user has at most one default space;
    /// without one, the client opens the last used space.
    /// </summary>
    public bool IsDefault { get; private set; }

    /// <summary>
    /// Sets whether this is the user's default space.
    /// </summary>
    /// <param name="isDefault">Whether this space should be the default.</param>
    public void SetDefault(bool isDefault) => IsDefault = isDefault;

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
    /// <returns>The new membership.</returns>
    public static UserSpace Create(User user, Space space, Role role) =>
        new()
        {
            User = user,
            Space = space,
            Role = role,
        };
}
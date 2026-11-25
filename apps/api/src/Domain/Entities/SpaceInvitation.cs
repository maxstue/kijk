namespace Kijk.Domain.Entities;

/// <summary>
/// A single-use invitation to join a shared space with a given role. Only the SHA-256 hash of its token is stored;
/// the token itself is shown once to the inviting admin and never persisted or logged.
/// </summary>
public sealed class SpaceInvitation : BaseEntity
{
    /// <summary>How long an invitation can be accepted.</summary>
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(7);

    /// <summary>How long an expired, revoked or accepted invitation is kept before the cleanup deletes it.</summary>
    public static readonly TimeSpan Retention = TimeSpan.FromDays(30);

    /// <summary>Gets the id of <see cref="Space" />.</summary>
    public Guid SpaceId { get; init; }
    /// <summary>Gets the space the invitation is for.</summary>
    public required Space Space { get; init; }

    /// <summary>Gets the id of <see cref="Role" />.</summary>
    public Guid RoleId { get; init; }
    /// <summary>Gets the role the invited person receives.</summary>
    public required Role Role { get; init; }

    /// <summary>Gets the SHA-256 hash of the invitation token.</summary>
    public required byte[] TokenHash { get; init; }

    /// <summary>Gets when the invitation can no longer be accepted (UTC).</summary>
    public DateTime ExpiresAt { get; init; }

    /// <summary>Gets the id of <see cref="CreatedBy" />.</summary>
    public Guid CreatedById { get; init; }
    /// <summary>Gets the member who created the invitation.</summary>
    public required User CreatedBy { get; init; }

    /// <summary>Gets when the invitation was accepted (UTC).</summary>
    public DateTime? AcceptedAt { get; private set; }

    /// <summary>Gets the id of the user who accepted the invitation.</summary>
    public Guid? AcceptedById { get; private set; }

    /// <summary>Gets when the invitation was revoked (UTC).</summary>
    public DateTime? RevokedAt { get; private set; }

    /// <summary>Determines whether the invitation can still be accepted.</summary>
    /// <param name="utcNow">The current time.</param>
    /// <returns><see langword="true" /> while the invitation is neither used, revoked nor expired.</returns>
    public bool IsPending(DateTime utcNow) => AcceptedAt is null && RevokedAt is null && ExpiresAt > utcNow;

    /// <summary>Marks the invitation as used. Callers check <see cref="IsPending" /> first.</summary>
    /// <param name="userId">The user who accepted it.</param>
    /// <param name="utcNow">The current time.</param>
    public void Accept(Guid userId, DateTime utcNow)
    {
        if (!IsPending(utcNow))
        {
            throw new InvalidOperationException("Only a pending invitation can be accepted");
        }

        AcceptedAt = utcNow;
        AcceptedById = userId;
    }

    /// <summary>
    /// Uses up the invitation for a user and creates their membership with the invited role. Callers check
    /// <see cref="IsPending" /> first and load <see cref="Space" /> and <see cref="Role" />.
    /// </summary>
    /// <param name="user">The joining user.</param>
    /// <param name="utcNow">The current time.</param>
    /// <returns>The new membership.</returns>
    public UserSpace AcceptFor(User user, DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(user);
        Accept(user.Id, utcNow);
        return UserSpace.Create(user, Space, Role);
    }

    /// <summary>Revokes the invitation, so it can no longer be accepted.</summary>
    /// <param name="utcNow">The current time.</param>
    public void Revoke(DateTime utcNow) => RevokedAt ??= utcNow;

    /// <summary>Creates an invitation that expires after <see cref="Lifetime" />.</summary>
    /// <param name="space">The shared space.</param>
    /// <param name="role">The role the invited person receives.</param>
    /// <param name="createdBy">The inviting member.</param>
    /// <param name="tokenHash">The SHA-256 hash of the token.</param>
    /// <param name="utcNow">The current time.</param>
    /// <returns>The new invitation.</returns>
    public static SpaceInvitation Create(Space space, Role role, User createdBy, byte[] tokenHash, DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(space);
        if (space.IsPersonal)
        {
            throw new InvalidOperationException("A personal space cannot have invitations");
        }

        return new()
        {
            Space = space,
            Role = role,
            CreatedBy = createdBy,
            TokenHash = tokenHash,
            ExpiresAt = utcNow.Add(Lifetime)
        };
    }
}
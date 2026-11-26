namespace Kijk.Domain.Entities;

/// <summary>
/// An invitation to join a shared space with a given role. It is bound to one person: to an identity at the
/// authentication provider (<see cref="InviteeAuthId" />) or, for a person without an account, to an invitation of the
/// authentication provider (<see cref="ProviderInvitationId" />) until that person signs up. Kijk never stores the
/// e-mail address of an invited person; <see cref="InviteeLabel" /> holds only a shortened form for display.
/// </summary>
public sealed class SpaceInvitation : BaseEntity
{
    /// <summary>How long an invitation can be accepted. The authentication provider's invitation expires at the same time.</summary>
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(7);

    /// <summary>How long an expired, revoked, declined or accepted invitation is kept before the cleanup deletes it.</summary>
    public static readonly TimeSpan Retention = TimeSpan.FromDays(30);

    /// <summary>The maximum length of <see cref="InviteeLabel" />.</summary>
    public const int InviteeLabelMaxLength = 120;

    /// <summary>Gets the id of <see cref="Space" />.</summary>
    public Guid SpaceId { get; init; }
    /// <summary>Gets the space the invitation is for.</summary>
    public required Space Space { get; init; }

    /// <summary>Gets the id of <see cref="Role" />.</summary>
    public Guid RoleId { get; init; }
    /// <summary>Gets the role the invited person receives.</summary>
    public required Role Role { get; init; }

    /// <summary>
    /// Gets the authentication provider's id of the invited person. It is not a foreign key, because a person with an
    /// account at the provider may not have finished Kijk's onboarding yet. Empty until a person invited by e-mail
    /// without an account signs up.
    /// </summary>
    public string? InviteeAuthId { get; private set; }

    /// <summary>
    /// Gets the id of the authentication provider's invitation that carries the e-mail to a person without an account.
    /// The cleanup deletes that invitation, and with it the e-mail address, once it is no longer needed and then clears
    /// this id.
    /// </summary>
    public string? ProviderInvitationId { get; private set; }

    /// <summary>
    /// Gets how the invited person is shown to the space admins: the unique name (<c>Max#4821</c>) for invitations by
    /// name, a shortened e-mail address (<c>an***@gm***.com</c>) for invitations by e-mail.
    /// </summary>
    public string InviteeLabel { get; private set; } = string.Empty;

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

    /// <summary>Gets when the invited person declined the invitation (UTC).</summary>
    public DateTime? DeclinedAt { get; private set; }

    /// <summary>Gets when the invitation was revoked (UTC).</summary>
    public DateTime? RevokedAt { get; private set; }

    /// <summary>Determines whether the invitation can still be accepted.</summary>
    /// <param name="utcNow">The current time.</param>
    /// <returns><see langword="true" /> while the invitation is neither accepted, declined, revoked nor expired.</returns>
    public bool IsPending(DateTime utcNow) =>
        AcceptedAt is null && DeclinedAt is null && RevokedAt is null && ExpiresAt > utcNow;

    /// <summary>Marks the invitation as used. Callers check <see cref="IsPending" /> first.</summary>
    /// <param name="userId">The user who accepted it.</param>
    /// <param name="utcNow">The current time.</param>
    public void Accept(Guid userId, DateTime utcNow)
    {
        EnsurePending(utcNow);
        AcceptedAt = utcNow;
        AcceptedById = userId;
    }

    /// <summary>Records that the invited person declined. Callers check <see cref="IsPending" /> first.</summary>
    /// <param name="utcNow">The current time.</param>
    public void Decline(DateTime utcNow)
    {
        EnsurePending(utcNow);
        DeclinedAt = utcNow;
    }

    /// <summary>Revokes the invitation, so it can no longer be accepted.</summary>
    /// <param name="utcNow">The current time.</param>
    public void Revoke(DateTime utcNow) => RevokedAt ??= utcNow;

    /// <summary>
    /// Binds an invitation sent by e-mail to the person who signed up through it. The provider invitation stays
    /// recorded until the cleanup has deleted it.
    /// </summary>
    /// <param name="authId">The new identity at the authentication provider.</param>
    public void LinkInvitee(string authId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(authId);
        if (InviteeAuthId is not null)
        {
            throw new InvalidOperationException("The invitation is already bound to a person");
        }

        InviteeAuthId = authId;
    }

    /// <summary>Records the authentication provider's invitation that delivers this invitation by e-mail.</summary>
    /// <param name="providerInvitationId">The provider's invitation id.</param>
    public void AttachProviderInvitation(string providerInvitationId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(providerInvitationId);
        ProviderInvitationId = providerInvitationId;
    }

    /// <summary>Creates an invitation for a person with an account at the authentication provider.</summary>
    /// <param name="space">The shared space.</param>
    /// <param name="role">The role the invited person receives.</param>
    /// <param name="createdBy">The inviting member.</param>
    /// <param name="inviteeAuthId">The invited person's identity at the authentication provider.</param>
    /// <param name="inviteeLabel">How the invited person is shown to the space admins.</param>
    /// <param name="utcNow">The current time.</param>
    /// <returns>The new invitation.</returns>
    public static SpaceInvitation ForIdentity(Space space, Role role, User createdBy, string inviteeAuthId, string inviteeLabel, DateTime utcNow)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(inviteeAuthId);
        var invitation = Create(space, role, createdBy, inviteeLabel, utcNow);
        invitation.InviteeAuthId = inviteeAuthId;
        return invitation;
    }

    /// <summary>
    /// Creates an invitation for a person without an account. Attach the provider invitation that delivers the e-mail
    /// with <see cref="AttachProviderInvitation" />.
    /// </summary>
    /// <param name="space">The shared space.</param>
    /// <param name="role">The role the invited person receives.</param>
    /// <param name="createdBy">The inviting member.</param>
    /// <param name="inviteeLabel">The shortened e-mail address shown to the space admins.</param>
    /// <param name="utcNow">The current time.</param>
    /// <returns>The new invitation.</returns>
    public static SpaceInvitation ForNewAccount(Space space, Role role, User createdBy, string inviteeLabel, DateTime utcNow) =>
        Create(space, role, createdBy, inviteeLabel, utcNow);

    private static SpaceInvitation Create(Space space, Role role, User createdBy, string inviteeLabel, DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(space);
        ArgumentException.ThrowIfNullOrWhiteSpace(inviteeLabel);
        if (space.IsPersonal)
        {
            throw new InvalidOperationException("A personal space cannot have invitations");
        }

        return new()
        {
            Space = space,
            Role = role,
            CreatedBy = createdBy,
            InviteeLabel = inviteeLabel,
            ExpiresAt = utcNow.Add(Lifetime)
        };
    }

    private void EnsurePending(DateTime utcNow)
    {
        if (!IsPending(utcNow))
        {
            throw new InvalidOperationException("Only a pending invitation can be accepted or declined");
        }
    }
}
namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// A pending invitation to a shared space, as the space admins see it.
/// </summary>
/// <param name="Id">The invitation identifier.</param>
/// <param name="InviteeLabel">
/// The invited person: the unique name (<c>Max#4821</c>) for invitations by name, a shortened e-mail address
/// (<c>an***@gm***.com</c>) for invitations by e-mail. An invitation by e-mail never shows whether the address belongs
/// to a Kijk account.
/// </param>
/// <param name="RoleId">The identifier of the role the invited person receives.</param>
/// <param name="RoleName">The name of the role the invited person receives.</param>
/// <param name="CreatedByName">The display name of the inviting member.</param>
/// <param name="CreatedAt">When the invitation was created (UTC).</param>
/// <param name="ExpiresAt">When the invitation expires (UTC).</param>
public sealed record SpaceInvitationResponse(
    Guid Id,
    string InviteeLabel,
    Guid RoleId,
    string RoleName,
    string CreatedByName,
    DateTime CreatedAt,
    DateTime ExpiresAt);
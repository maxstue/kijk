namespace Kijk.Application.Users.Invitations;

/// <summary>
/// A pending invitation in the current user's inbox.
/// </summary>
/// <param name="Id">The invitation identifier.</param>
/// <param name="SpaceId">The identifier of the space the invitation is for.</param>
/// <param name="SpaceName">The name of the space.</param>
/// <param name="RoleId">The identifier of the role the user receives when accepting.</param>
/// <param name="RoleName">The name of that role.</param>
/// <param name="InvitedByName">The display name of the inviting member.</param>
/// <param name="CreatedAt">When the invitation was created (UTC).</param>
/// <param name="ExpiresAt">When the invitation expires (UTC).</param>
public sealed record ReceivedInvitationResponse(
    Guid Id,
    Guid SpaceId,
    string SpaceName,
    Guid RoleId,
    string RoleName,
    string InvitedByName,
    DateTime CreatedAt,
    DateTime ExpiresAt);
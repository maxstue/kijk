namespace Kijk.Application.Spaces.PreviewInvitation;

/// <summary>
/// What an invitation offers, shown on the invitation page before signing in and before accepting.
/// </summary>
/// <param name="SpaceName">The name of the shared space.</param>
/// <param name="RoleId">The identifier of the role the invited person receives.</param>
/// <param name="RoleName">The name of the role the invited person receives.</param>
/// <param name="InvitedByName">The display name of the member who created the invitation.</param>
/// <param name="ExpiresAt">When the invitation expires (UTC).</param>
/// <param name="SpaceId">
/// The space identifier, set only when the signed-in user is already a member; accepting is then not possible.
/// </param>
public sealed record InvitationPreviewResponse(
    string SpaceName,
    Guid RoleId,
    string RoleName,
    string InvitedByName,
    DateTime ExpiresAt,
    Guid? SpaceId);
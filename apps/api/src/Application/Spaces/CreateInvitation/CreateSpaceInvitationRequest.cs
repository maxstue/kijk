namespace Kijk.Application.Spaces.CreateInvitation;

/// <summary>
/// Contains the role of a new invitation.
/// </summary>
/// <param name="RoleId">
/// The role the invited person receives: Member (the default when omitted) or Viewer. Admins are appointed later by
/// changing a member's role.
/// </param>
public sealed record CreateSpaceInvitationRequest(Guid? RoleId);

/// <summary>
/// A new invitation. The token is returned only in this response and cannot be retrieved again.
/// </summary>
/// <param name="Id">The invitation identifier.</param>
/// <param name="Token">The single-use invitation token.</param>
/// <param name="Link">
/// The app-relative invitation link in the form <c>/invite#&lt;token&gt;</c>. The token is in the URL fragment, so
/// browsers never send it to a server.
/// </param>
/// <param name="RoleId">The identifier of the role the invited person receives.</param>
/// <param name="ExpiresAt">When the invitation expires (UTC).</param>
public sealed record CreateSpaceInvitationResponse(Guid Id, string Token, string Link, Guid RoleId, DateTime ExpiresAt);
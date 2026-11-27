namespace Kijk.Application.Spaces.CreateInvitation;

/// <summary>
/// Invites one person into a shared space, either by unique name or by e-mail address.
/// </summary>
/// <param name="RoleId">
/// The role the invited person receives: Member (the default when omitted) or Viewer. Admins are appointed later by
/// changing a member's role.
/// </param>
/// <param name="UniqueName">
/// The invited person's unique name, for example <c>Max#4821</c>. It must match exactly, ignoring case; an unknown
/// name results in 404. Set either this or <paramref name="Email" />.
/// </param>
/// <param name="Email">
/// The invited person's e-mail address. A person with an account finds the invitation in their inbox; a person
/// without one receives an invitation e-mail from the authentication provider. Both cases return the same response,
/// and Kijk stores only a shortened form of the address. Set either this or <paramref name="UniqueName" />.
/// </param>
public sealed record CreateSpaceInvitationRequest(Guid? RoleId, string? UniqueName, string? Email);
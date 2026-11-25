namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// A pending invitation to a shared space. The token is never part of it.
/// </summary>
/// <param name="Id">The invitation identifier.</param>
/// <param name="RoleId">The identifier of the role the invited person receives.</param>
/// <param name="RoleName">The name of the role the invited person receives.</param>
/// <param name="CreatedByName">The display name of the inviting member.</param>
/// <param name="CreatedAt">When the invitation was created (UTC).</param>
/// <param name="ExpiresAt">When the invitation expires (UTC).</param>
public sealed record SpaceInvitationResponse(
    Guid Id,
    Guid RoleId,
    string RoleName,
    string CreatedByName,
    DateTime CreatedAt,
    DateTime ExpiresAt);
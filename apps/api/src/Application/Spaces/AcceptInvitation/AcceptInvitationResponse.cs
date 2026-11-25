namespace Kijk.Application.Spaces.AcceptInvitation;

/// <summary>
/// The space the current user joined by accepting an invitation.
/// </summary>
/// <param name="SpaceId">The space identifier.</param>
/// <param name="SpaceName">The name of the space.</param>
/// <param name="RoleId">The identifier of the role the user received.</param>
public sealed record AcceptInvitationResponse(Guid SpaceId, string SpaceName, Guid RoleId);
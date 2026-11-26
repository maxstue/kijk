namespace Kijk.Application.Users.AcceptInvitation;

/// <summary>
/// The space the current user joined, or already belonged to.
/// </summary>
/// <param name="SpaceId">The space identifier.</param>
public sealed record AcceptInvitationResponse(Guid SpaceId);
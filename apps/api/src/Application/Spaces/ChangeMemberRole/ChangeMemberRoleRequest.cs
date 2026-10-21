namespace Kijk.Application.Spaces.ChangeMemberRole;

/// <summary>
/// Contains the new role of a space member.
/// </summary>
/// <param name="RoleId">The identifier of the new role.</param>
public sealed record ChangeMemberRoleRequest(Guid RoleId);
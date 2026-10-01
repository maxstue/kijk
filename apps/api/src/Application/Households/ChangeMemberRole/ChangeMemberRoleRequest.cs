namespace Kijk.Application.Households.ChangeMemberRole;

/// <summary>
/// Contains the new role of a household member.
/// </summary>
/// <param name="RoleId">The identifier of the new role.</param>
public sealed record ChangeMemberRoleRequest(Guid RoleId);
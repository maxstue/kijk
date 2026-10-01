namespace Kijk.Application.Households.Shared;

/// <summary>
/// A household role and the permissions it grants.
/// </summary>
/// <param name="Id">The role identifier.</param>
/// <param name="Name">The role name.</param>
/// <param name="Permissions">The permission names granted by the role.</param>
public sealed record HouseholdRoleResponse(Guid Id, string Name, IReadOnlyList<string> Permissions);

/// <summary>
/// A member of a household.
/// </summary>
/// <param name="UserId">The member's user identifier.</param>
/// <param name="Name">The member's display name.</param>
/// <param name="Role">The member's role in the household.</param>
/// <param name="IsCurrentUser">Whether the member is the current user.</param>
public sealed record HouseholdMemberResponse(Guid UserId, string Name, HouseholdRoleResponse Role, bool IsCurrentUser);
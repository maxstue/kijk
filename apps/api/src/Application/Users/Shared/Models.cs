using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Users.Shared;

public record UserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    bool? UseDefaultResources);

public record GetMeUserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    IEnumerable<UserHouseholdResponse>? Households,
    IEnumerable<UserResourceResponse>? Resources);

public record UserHouseholdResponse(Guid Id, string Name, string? Description, UserHouseholdRoleResponse Role, bool IsActive)
{
    public static UserHouseholdResponse Create(UserHousehold userHousehold) =>
        new(userHousehold.Id, userHousehold.Household.Name, userHousehold.Household.Description, UserHouseholdRoleResponse.Create(userHousehold.Role),
            userHousehold.IsActive);
}

public record UserHouseholdRoleResponse(Guid Id, string Name, IList<string> Permissions)
{
    public static UserHouseholdRoleResponse Create(Role role) => new(role.Id, role.Name, [.. role.Permissions.Select(x => x.Name)]);
}

public record UserResourceResponse(Guid Id, string Name, string Unit, string Color, CreatorType CreatorType);
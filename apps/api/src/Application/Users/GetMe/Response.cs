using Kijk.Shared;

namespace Kijk.Application.Users.GetMe;

public record GetMeUserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    IEnumerable<UserHouseholdResponse>? Households,
    IEnumerable<UserResourceResponse>? Resources);

public record UserHouseholdResponse(Guid Id, string Name, string? Description, UserHouseholdRoleResponse Role, bool IsActive);

public record UserHouseholdRoleResponse(Guid Id, string Name, IList<string> Permissions);

public record UserResourceResponse(Guid Id, string Name, string Unit, string Color, CreatorType CreatorType);
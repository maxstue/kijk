using Kijk.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Users.GetMe;

/// <summary>
/// Projects user entities to detailed current-user responses.
/// </summary>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class GetMeUserResponseMapper
{
    /// <summary>
    /// Projects user entities to detailed responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The user query.</param>
    /// <returns>The projected response query.</returns>
    public static partial IQueryable<GetMeUserResponse> ProjectToResponse(this IQueryable<User> source);

    [MapProperty(nameof(User.UserHouseholds), nameof(GetMeUserResponse.Households))]
    private static partial GetMeUserResponse Map(User source);

    [MapProperty(nameof(UserHousehold.Household.Name), nameof(UserHouseholdResponse.Name))]
    [MapProperty(nameof(UserHousehold.Household.Description), nameof(UserHouseholdResponse.Description))]
    private static partial UserHouseholdResponse MapHousehold(UserHousehold source);

    private static string MapPermission(Permission source) => source.Name;
}
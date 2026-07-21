using Kijk.Domain.Entities;
using Kijk.Shared;
using Riok.Mapperly.Abstractions;

namespace Kijk.Api.Middleware;

/// <summary>
/// Projects user entities to the authenticated-user representation.
/// </summary>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class SimpleAuthUserMapper
{
    /// <summary>
    /// Projects user entities to authenticated users in the underlying query provider.
    /// </summary>
    /// <param name="source">The user query.</param>
    /// <returns>The projected authenticated-user query.</returns>
    public static partial IQueryable<SimpleAuthUser> ToSimpleAuthUser(this IQueryable<User> source);

    [MapPropertyFromSource(nameof(SimpleAuthUser.HouseholdId), Use = nameof(MapActiveHouseholdId))]
    private static partial SimpleAuthUser Map(User source);

    private static Guid? MapActiveHouseholdId(User source) => source.UserHouseholds
        .Where(userHousehold => userHousehold.IsActive)
        .Select(userHousehold => userHousehold.HouseholdId)
        .SingleOrDefault();
}
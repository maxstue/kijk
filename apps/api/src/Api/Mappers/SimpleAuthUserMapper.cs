using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Api.Mappers;

/// <summary>
/// Projects user entities to the authenticated-user representation.
/// </summary>
public static class SimpleAuthUserMapper
{
    /// <summary>
    /// Projects user entities to authenticated users, including the role and permissions in the requested space.
    /// </summary>
    /// <param name="source">The user query.</param>
    /// <param name="spaceId">The space of the request, or <see langword="null" /> for requests without a space.</param>
    /// <returns>The projected authenticated-user query; without a membership in the space it has no space.</returns>
    public static IQueryable<SimpleAuthUser> ToSimpleAuthUser(this IQueryable<User> source, Guid? spaceId) =>
        source.Select(user => new SimpleAuthUser(
            user.Id,
            user.AuthId,
            user.UserSpaces.Where(link => link.SpaceId == spaceId).Select(link => (Guid?)link.SpaceId).SingleOrDefault(),
            user.Name,
            user.Email,
            user.OnboardingCompletedAt != null)
        {
            SpaceRole = user.UserSpaces.Where(link => link.SpaceId == spaceId).Select(link => link.Role.Name).SingleOrDefault(),
            SpacePermissions = user.UserSpaces
                .Where(link => link.SpaceId == spaceId)
                .SelectMany(link => link.Role.Permissions.Select(permission => permission.Name))
                .ToList()
        });
}
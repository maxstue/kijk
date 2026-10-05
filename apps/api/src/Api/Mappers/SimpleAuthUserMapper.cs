using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Api.Mappers;

/// <summary>
/// Projects user entities to the authenticated-user representation.
/// </summary>
public static class SimpleAuthUserMapper
{
    /// <summary>
    /// Projects user entities to authenticated users, including the role and permissions of the active space.
    /// </summary>
    /// <param name="source">The user query.</param>
    /// <returns>The projected authenticated-user query.</returns>
    public static IQueryable<SimpleAuthUser> ToSimpleAuthUser(this IQueryable<User> source) =>
        source.Select(user => new SimpleAuthUser(
            user.Id,
            user.AuthId,
            user.UserSpaces.Where(link => link.IsActive).Select(link => (Guid?)link.SpaceId).SingleOrDefault(),
            user.Name,
            user.Email,
            user.OnboardingCompletedAt != null)
        {
            SpaceRole = user.UserSpaces.Where(link => link.IsActive).Select(link => link.Role.Name).SingleOrDefault(),
            SpacePermissions = user.UserSpaces
                .Where(link => link.IsActive)
                .SelectMany(link => link.Role.Permissions.Select(permission => permission.Name))
                .ToList()
        });
}
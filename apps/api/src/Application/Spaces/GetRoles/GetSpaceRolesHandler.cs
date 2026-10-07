using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Shared;

namespace Kijk.Application.Spaces.GetRoles;

/// <summary>
/// Gets the fixed space roles and the permissions they grant.
/// </summary>
public sealed class GetSpaceRolesHandler(IAppDbContext dbContext) : IHandler
{
    /// <summary>
    /// Gets all space roles ordered by the number of granted permissions, the most powerful role first.
    /// </summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The space roles.</returns>
    public async Task<Result<IReadOnlyList<SpaceRoleResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var roles = await dbContext.Roles
            .AsNoTracking()
            .Select(role => new SpaceRoleResponse(
                role.Id,
                role.Name,
                role.Permissions.OrderBy(permission => permission.Name).Select(permission => permission.Name).ToList()))
            .ToListAsync(cancellationToken);

        return roles
            .OrderByDescending(role => role.Permissions.Count)
            .ThenBy(role => role.Name, StringComparer.Ordinal)
            .ToList();
    }
}
using Kijk.Application.Households.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Households.GetRoles;

/// <summary>
/// Gets the fixed household roles and the permissions they grant.
/// </summary>
public sealed class GetHouseholdRolesHandler(IAppDbContext dbContext) : IHandler
{
    /// <summary>
    /// Gets all household roles ordered by the number of granted permissions, the most powerful role first.
    /// </summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The household roles.</returns>
    public async Task<Result<IReadOnlyList<HouseholdRoleResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var roles = await dbContext.Roles
            .AsNoTracking()
            .Select(role => new HouseholdRoleResponse(
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
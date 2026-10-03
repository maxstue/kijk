using Kijk.Application.Households.Shared;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Households.GetMembers;

/// <summary>
/// Gets the members of a household with their roles.
/// </summary>
public sealed class GetHouseholdMembersHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>
    /// Gets the members of a household when the current user's role allows viewing them.
    /// </summary>
    /// <param name="householdId">The household identifier.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The household members ordered by name.</returns>
    public async Task<Result<IReadOnlyList<HouseholdMemberResponse>>> GetAllAsync(Guid householdId, CancellationToken cancellationToken)
    {
        if (await dbContext.AuthorizeHouseholdAsync(currentUser.Id, householdId, HouseholdPermissions.Members.View, cancellationToken) is { } error)
        {
            return error;
        }

        var currentUserId = currentUser.Id;
        var members = await dbContext.UserHouseholds
            .AsNoTracking()
            .Where(link => link.HouseholdId == householdId)
            .OrderBy(link => link.User.Name)
            .Select(link => new HouseholdMemberResponse(
                link.UserId,
                link.User.Name,
                new HouseholdRoleResponse(
                    link.Role.Id,
                    link.Role.Name,
                    link.Role.Permissions.OrderBy(permission => permission.Name).Select(permission => permission.Name).ToList()),
                link.UserId == currentUserId))
            .ToListAsync(cancellationToken);

        return members;
    }
}
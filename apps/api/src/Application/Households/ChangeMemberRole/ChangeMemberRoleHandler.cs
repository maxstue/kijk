using Kijk.Application.Households.Shared;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Households.ChangeMemberRole;

/// <summary>
/// Changes the role of another member of a household.
/// </summary>
public sealed class ChangeMemberRoleHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>
    /// Changes a member's role when the current user's role allows assigning roles.
    /// Users cannot change their own role. Because the acting user keeps the permission to assign roles, a household
    /// can never lose its last member who is allowed to assign roles.
    /// </summary>
    /// <param name="householdId">The household identifier.</param>
    /// <param name="userId">The identifier of the member whose role changes.</param>
    /// <param name="request">The new role.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated member.</returns>
    public async Task<Result<HouseholdMemberResponse>> ChangeAsync(
        Guid householdId,
        Guid userId,
        ChangeMemberRoleRequest request,
        CancellationToken cancellationToken)
    {
        if (await dbContext.AuthorizeHouseholdAsync(currentUser.Id, householdId, HouseholdPermissions.Members.AssignRole, cancellationToken) is { } error)
        {
            return error;
        }

        if (userId == currentUser.Id)
        {
            return Error.Validation("You cannot change your own household role");
        }

        var membership = await dbContext.UserHouseholds
            .Include(link => link.User)
            .Include(link => link.Role)
                .ThenInclude(role => role.Permissions)
            .FirstOrDefaultAsync(link => link.HouseholdId == householdId && link.UserId == userId, cancellationToken);
        if (membership is null)
        {
            return Error.NotFound("Household member could not be found");
        }

        var role = await dbContext.Roles
            .Include(item => item.Permissions)
            .FirstOrDefaultAsync(item => item.Id == request.RoleId, cancellationToken);
        if (role is null)
        {
            return Error.Validation("Household role does not exist");
        }

        membership.ChangeRole(role);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new HouseholdMemberResponse(
            membership.UserId,
            membership.User.Name,
            new HouseholdRoleResponse(role.Id, role.Name, role.Permissions.Select(permission => permission.Name).Order(StringComparer.Ordinal).ToList()),
            false);
    }
}
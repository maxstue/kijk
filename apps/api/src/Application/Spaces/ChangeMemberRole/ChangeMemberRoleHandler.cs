using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Spaces.ChangeMemberRole;

/// <summary>
/// Changes the role of another member of a space.
/// </summary>
public sealed class ChangeMemberRoleHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>
    /// Changes a member's role when the current user's role allows assigning roles.
    /// Users cannot change their own role. Because the acting user keeps the permission to assign roles, a space
    /// can never lose its last member who is allowed to assign roles.
    /// </summary>
    /// <param name="spaceId">The space identifier.</param>
    /// <param name="userId">The identifier of the member whose role changes.</param>
    /// <param name="request">The new role.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated member.</returns>
    public async Task<Result<SpaceMemberResponse>> ChangeAsync(
        Guid spaceId,
        Guid userId,
        ChangeMemberRoleRequest request,
        CancellationToken cancellationToken)
    {
        if (await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, SpacePermissions.Members.AssignRole, cancellationToken) is { } error)
        {
            return error;
        }

        if (userId == currentUser.Id)
        {
            return Error.Validation("You cannot change your own space role");
        }

        var membership = await dbContext.UserSpaces
            .Include(link => link.User)
            .Include(link => link.Role.Permissions)
            .FirstOrDefaultAsync(link => link.SpaceId == spaceId && link.UserId == userId, cancellationToken);
        if (membership is null)
        {
            return Error.NotFound("Space member could not be found");
        }

        var role = await dbContext.Roles
            .Include(item => item.Permissions)
            .FirstOrDefaultAsync(item => item.Id == request.RoleId, cancellationToken);
        if (role is null)
        {
            return Error.Validation("Space role does not exist");
        }

        membership.ChangeRole(role);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new SpaceMemberResponse(
            membership.UserId,
            membership.User.Name,
            new SpaceRoleResponse(role.Id, role.Name, role.Permissions.Select(permission => permission.Name).Order(StringComparer.Ordinal).ToList()),
            false);
    }
}
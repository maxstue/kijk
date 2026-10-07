using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Spaces.GetMembers;

/// <summary>
/// Gets the members of a space with their roles.
/// </summary>
public sealed class GetSpaceMembersHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>
    /// Gets the members of a space when the current user's role allows viewing them.
    /// </summary>
    /// <param name="spaceId">The space identifier.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The space members ordered by name.</returns>
    public async Task<Result<IReadOnlyList<SpaceMemberResponse>>> GetAllAsync(Guid spaceId, CancellationToken cancellationToken)
    {
        if (await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, SpacePermissions.Members.View, cancellationToken) is { } error)
        {
            return error;
        }

        var currentUserId = currentUser.Id;
        var members = await dbContext.UserSpaces
            .AsNoTracking()
            .Where(link => link.SpaceId == spaceId)
            .OrderBy(link => link.User.Name)
            .Select(link => new SpaceMemberResponse(
                link.UserId,
                link.User.Name,
                new SpaceRoleResponse(
                    link.Role.Id,
                    link.Role.Name,
                    link.Role.Permissions.OrderBy(permission => permission.Name).Select(permission => permission.Name).ToList()),
                link.UserId == currentUserId))
            .ToListAsync(cancellationToken);

        return members;
    }
}
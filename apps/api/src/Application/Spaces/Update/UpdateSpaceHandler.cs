using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Spaces.Update;

/// <summary>
/// Updates the details of a space managed by the current user.
/// </summary>
public sealed class UpdateSpaceHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>
    /// Updates a space when the current user's role allows configuring it.
    /// </summary>
    /// <param name="id">The space identifier.</param>
    /// <param name="request">The updated space details.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>Whether the space was updated.</returns>
    public async Task<Result<bool>> UpdateAsync(Guid id, UpdateSpaceRequest request, CancellationToken cancellationToken)
    {
        var membership = await dbContext.UserSpaces
            .Include(link => link.Space)
            .Include(link => link.Role.Permissions)
            .FirstOrDefaultAsync(link => link.UserId == currentUser.Id && link.SpaceId == id, cancellationToken);

        if (membership is null)
        {
            return Error.NotFound("Space could not be found");
        }

        if (!membership.Role.HasPermission(SpacePermissions.Space.Configure))
        {
            return Error.Authorization("Your space role does not allow changing space details");
        }

        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        membership.Space.UpdateDetails(request.Name.Trim(), description);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
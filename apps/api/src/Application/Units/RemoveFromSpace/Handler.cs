using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Units.RemoveFromSpace;

/// <summary>Removes a user-owned unit from a space.</summary>
public sealed class RemoveFromSpaceHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>Removes a share of a unit owned by the current user; requires the units:share permission in the space.</summary>
    /// <param name="id">The unit id.</param>
    /// <param name="spaceId">The space id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found/authorization/conflict error.</returns>
    public async Task<Result<bool>> HandleAsync(Guid id, Guid spaceId, CancellationToken cancellationToken)
    {
        var link = await dbContext.UnitSpaces
            .Include(item => item.Unit)
            .FirstOrDefaultAsync(item => item.UnitId == id && item.SpaceId == spaceId, cancellationToken);
        if (link is null || link.Unit.OwnerUserId != currentUser.Id)
        {
            return Error.NotFound("Unit share could not be found");
        }

        if (await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, SpacePermissions.Units.Share, cancellationToken) is { } error)
        {
            return error;
        }

        if (await dbContext.Resources.AnyAsync(resource => resource.SpaceId == spaceId && resource.UnitId == id,
                cancellationToken))
        {
            return Error.Conflict("The unit is still used by resources in this space");
        }

        dbContext.UnitSpaces.Remove(link);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
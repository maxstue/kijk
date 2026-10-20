using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Units.ShareWithSpace;

/// <summary>Shares a user-owned unit with a space.</summary>
public sealed class ShareWithSpaceHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>Shares a unit owned by the current user with a space; requires the units:share permission there.</summary>
    /// <param name="id">The unit id.</param>
    /// <param name="spaceId">The space id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found/authorization error.</returns>
    public async Task<Result<bool>> HandleAsync(Guid id, Guid spaceId, CancellationToken cancellationToken)
    {
        var unit = await dbContext.Units.Include(item => item.Spaces)
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == currentUser.Id, cancellationToken);
        if (unit is null)
        {
            return Error.NotFound("Unit or space could not be found");
        }

        if (await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, SpacePermissions.Units.Share, cancellationToken) is { } error)
        {
            return error;
        }

        if (unit.Spaces.All(link => link.SpaceId != spaceId))
        {
            dbContext.UnitSpaces.Add(new()
            {
                Unit = unit,
                SpaceId = spaceId,
                Space = null!,
                SharedByUserId = currentUser.Id,
                SharedByUser = null!,
                SharedAt = timeProvider.GetUtcNow().UtcDateTime
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
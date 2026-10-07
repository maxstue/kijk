using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Units.Manage;

/// <summary>
/// Archives, restores, shares, unshares, and deletes user-owned units.
/// </summary>
public sealed class ManageUnitHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    /// <summary>Archives or restores a unit owned by the current user.</summary>
    /// <param name="id">The unit id.</param>
    /// <param name="archived">Whether to archive (<see langword="true" />) or restore it.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found error.</returns>
    public Task<Result<bool>> ArchiveAsync(Guid id, bool archived, CancellationToken cancellationToken) =>
        SetArchivedAsync(id, archived, cancellationToken);

    /// <summary>Shares a unit owned by the current user with a space; requires the units:share permission there.</summary>
    /// <param name="id">The unit id.</param>
    /// <param name="spaceId">The space id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found/authorization error.</returns>
    public async Task<Result<bool>> ShareAsync(Guid id, Guid spaceId, CancellationToken cancellationToken)
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

    /// <summary>Removes a share of a unit owned by the current user; requires the units:share permission in the space.</summary>
    /// <param name="id">The unit id.</param>
    /// <param name="spaceId">The space id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found/authorization/conflict error.</returns>
    public async Task<Result<bool>> UnshareAsync(Guid id, Guid spaceId, CancellationToken cancellationToken)
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

    /// <summary>Deletes an unused, unshared unit owned by the current user.</summary>
    /// <param name="id">The unit id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found/conflict error.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var unit = await dbContext.Units.Include(item => item.Spaces)
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == currentUser.Id, cancellationToken);
        if (unit is null)
        {
            return Error.NotFound("Unit could not be found");
        }

        if (unit.Spaces.Count != 0 || await dbContext.Resources.AnyAsync(resource => resource.UnitId == id, cancellationToken))
        {
            return Error.Conflict("A shared or used unit cannot be deleted");
        }

        dbContext.Units.Remove(unit);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<Result<bool>> SetArchivedAsync(Guid id, bool archived, CancellationToken cancellationToken)
    {
        var unit = await dbContext.Units.FirstOrDefaultAsync(
            item => item.Id == id && item.OwnerUserId == currentUser.Id, cancellationToken);
        if (unit is null)
        {
            return Error.NotFound("Unit could not be found");
        }

        unit.ArchivedAt = archived ? timeProvider.GetUtcNow().UtcDateTime : null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
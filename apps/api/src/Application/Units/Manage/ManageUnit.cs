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
    public Task<Result<bool>> ArchiveAsync(Guid id, bool archived, CancellationToken cancellationToken) =>
        SetArchivedAsync(id, archived, cancellationToken);

    public async Task<Result<bool>> ShareAsync(Guid id, Guid householdId, CancellationToken cancellationToken)
    {
        var unit = await dbContext.Units.Include(item => item.Households)
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == currentUser.Id, cancellationToken);
        if (unit is null)
        {
            return Error.NotFound("Unit or household could not be found");
        }

        if (await dbContext.AuthorizeHouseholdAsync(currentUser.Id, householdId, HouseholdPermissions.Units.Share, cancellationToken) is { } error)
        {
            return error;
        }

        if (unit.Households.All(link => link.HouseholdId != householdId))
        {
            dbContext.UnitHouseholds.Add(new()
            {
                Unit = unit,
                HouseholdId = householdId,
                Household = null!,
                SharedByUserId = currentUser.Id,
                SharedByUser = null!,
                SharedAt = timeProvider.GetUtcNow().UtcDateTime
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return true;
    }

    public async Task<Result<bool>> UnshareAsync(Guid id, Guid householdId, CancellationToken cancellationToken)
    {
        var link = await dbContext.UnitHouseholds
            .Include(item => item.Unit)
            .FirstOrDefaultAsync(item => item.UnitId == id && item.HouseholdId == householdId, cancellationToken);
        if (link is null || link.Unit.OwnerUserId != currentUser.Id)
        {
            return Error.NotFound("Unit share could not be found");
        }

        if (await dbContext.AuthorizeHouseholdAsync(currentUser.Id, householdId, HouseholdPermissions.Units.Share, cancellationToken) is { } error)
        {
            return error;
        }

        if (await dbContext.Resources.AnyAsync(resource => resource.HouseholdId == householdId && resource.UnitId == id,
                cancellationToken))
        {
            return Error.Conflict("The unit is still used by resources in this household");
        }

        dbContext.UnitHouseholds.Remove(link);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var unit = await dbContext.Units.Include(item => item.Households)
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == currentUser.Id, cancellationToken);
        if (unit is null)
        {
            return Error.NotFound("Unit could not be found");
        }

        if (unit.Households.Count != 0 || await dbContext.Resources.AnyAsync(resource => resource.UnitId == id, cancellationToken))
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
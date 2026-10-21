using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Units.Delete;

/// <summary>Deletes an unused, unshared user unit.</summary>
public sealed class DeleteHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>Deletes an unused, unshared unit owned by the current user.</summary>
    /// <param name="id">The unit id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found/conflict error.</returns>
    public async Task<Result<bool>> HandleAsync(Guid id, CancellationToken cancellationToken)
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
}
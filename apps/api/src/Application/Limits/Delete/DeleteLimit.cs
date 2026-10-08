using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Limits.Delete;

/// <summary>Deletes consumption limits owned by the active space.</summary>
public sealed class DeleteLimitHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Deletes a limit of the active space.</summary>
    /// <param name="id">The limit id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found error.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var limit = await dbContext.Limits
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (limit is null)
        {
            return Error.NotFound("Consumption limit could not be found");
        }

        dbContext.Limits.Remove(limit);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
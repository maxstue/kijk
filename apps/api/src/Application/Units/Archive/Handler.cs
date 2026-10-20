using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Units.Archive;

/// <summary>Archives a user-owned unit.</summary>
public sealed class ArchiveHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>Archives a unit owned by the current user.</summary>
    /// <param name="id">The unit id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found error.</returns>
    public async Task<Result<bool>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        var unit = await dbContext.Units.FirstOrDefaultAsync(
            item => item.Id == id && item.OwnerUserId == currentUser.Id, cancellationToken);
        if (unit is null)
        {
            return Error.NotFound("Unit could not be found");
        }

        unit.ArchivedAt = timeProvider.GetUtcNow().UtcDateTime;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
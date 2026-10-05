using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Imports.Cancel;

/// <summary>
/// Cancels an open import and deletes its file and rows right away.
/// </summary>
public sealed class CancelImportHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    /// <summary>Cancels an import.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The cancelled import, or a not-found or conflict error.</returns>
    public async Task<Result<ImportJobResponse>> CancelAsync(Guid id, CancellationToken cancellationToken)
    {
        var job = await dbContext.GetVisibleImports(currentUser)
            .Include(item => item.Account)
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (job is null)
        {
            return Error.NotFound("Import could not be found");
        }

        if (!job.Cancel(timeProvider.GetUtcNow().UtcDateTime))
        {
            return Error.Conflict("The import is already finished");
        }

        dbContext.ImportCandidates.RemoveRange(await dbContext.ImportCandidates.Where(item => item.ImportJobId == id).ToListAsync(cancellationToken));
        dbContext.ImportFiles.RemoveRange(await dbContext.ImportFiles.Where(item => item.ImportJobId == id).ToListAsync(cancellationToken));
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Error.Conflict("The import was changed in the meantime");
        }

        return job.ToResponse();
    }
}
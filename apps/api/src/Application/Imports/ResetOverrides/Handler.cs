using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Imports.ResetOverrides;

/// <summary>Clears manual category choices across all rows of an import awaiting review.</summary>
public sealed class ResetOverridesHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>Leaves automatically assigned categories and import selections unchanged.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The number of cleared choices, or a not-found or conflict error.</returns>
    public async Task<Result<int>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        var job = await dbContext.GetVisibleImports(currentUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (job is null)
        {
            return Error.NotFound("Import could not be found");
        }

        if (job.Status != ImportJobStatus.NeedsReview)
        {
            return Error.Conflict("Manual categories can only be reset while the import waits for review");
        }

        var candidates = await dbContext.ImportCandidates
            .Where(item => item.ImportJobId == id && item.CategorySource == CategorySource.Manual)
            .ToListAsync(cancellationToken);
        foreach (var candidate in candidates)
        {
            candidate.ChooseCategory(null);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return candidates.Count;
    }
}
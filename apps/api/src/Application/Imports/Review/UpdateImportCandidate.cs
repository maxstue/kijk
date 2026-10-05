using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Imports.Review;

/// <summary>
/// Request for changing a row during the review.
/// </summary>
/// <param name="CategoryId">The category, or <see langword="null" /> to leave the row uncategorized.</param>
/// <param name="Excluded">Whether the row is not imported.</param>
/// <param name="CountsAsOffset">
/// For a card statement: whether its single purchases are imported separately, so it only offsets them. Unchanged
/// when omitted.
/// </param>
public sealed record UpdateImportCandidateRequest(Guid? CategoryId, bool Excluded, bool? CountsAsOffset = null);

/// <summary>
/// Changes the category or the exclusion of a row while the import waits for review.
/// </summary>
public sealed class UpdateImportCandidateHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Updates a row of an import.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="candidateId">The row id.</param>
    /// <param name="request">The changes.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The row, or a not-found or conflict error.</returns>
    public async Task<Result<ImportCandidateResponse>> UpdateAsync(
        Guid id,
        Guid candidateId,
        UpdateImportCandidateRequest request,
        CancellationToken cancellationToken)
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
            return Error.Conflict("The import does not wait for a review");
        }

        var candidate = await dbContext.ImportCandidates
            .FirstOrDefaultAsync(item => item.Id == candidateId && item.ImportJobId == id, cancellationToken);
        if (candidate is null)
        {
            return Error.NotFound("Row could not be found");
        }

        if (request.CategoryId is { } categoryId
            && !await dbContext.GetAvailableCategories(currentUser).AnyAsync(item => item.Id == categoryId, cancellationToken))
        {
            return Error.NotFound("Category is not available in the active space");
        }

        if (candidate.CategoryId != request.CategoryId)
        {
            candidate.ChooseCategory(request.CategoryId);
        }

        candidate.SetExcluded(request.Excluded);
        if (request.CountsAsOffset is { } countsAsOffset)
        {
            candidate.SetCountsAsOffset(countsAsOffset);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return candidate.ToResponse();
    }
}
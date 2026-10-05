using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Ai;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Imports.Categorize;

/// <summary>
/// Request for categorizing the rows of an import with the AI.
/// </summary>
/// <param name="AiDataSharing">Which data the AI may see for this import; the household's level when omitted.</param>
public sealed record CategorizeImportRequest(AiDataSharing? AiDataSharing = null);

/// <summary>
/// Validates the request for categorizing an import.
/// </summary>
public sealed class CategorizeImportValidator : AbstractValidator<CategorizeImportRequest>
{
    /// <summary>Creates the validator rules.</summary>
    public CategorizeImportValidator() =>
        RuleFor(request => request.AiDataSharing).IsInEnum().When(request => request.AiDataSharing is not null).WithErrorCode(ErrorCodes.ValidationError);
}

/// <summary>
/// Starts the AI categorization of an import waiting for review, e.g. to catch up after the AI was unavailable or to
/// share more than the household default for a single import. Rows with a category are never changed.
/// </summary>
public sealed class CategorizeImportHandler(IAppDbContext dbContext, CurrentUser currentUser, IAiGate aiGate, IImportJobQueue queue) : IHandler
{
    /// <summary>Queues the categorization.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="request">The request.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The import, or a not-found, validation or conflict error.</returns>
    public async Task<Result<ImportJobResponse>> CategorizeAsync(Guid id, CategorizeImportRequest request, CancellationToken cancellationToken)
    {
        var job = await dbContext.GetVisibleImports(currentUser)
            .Include(item => item.Account)
            .Include(item => item.Household)
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (job is null)
        {
            return Error.NotFound("Import could not be found");
        }

        if (job.Status != ImportJobStatus.NeedsReview)
        {
            return Error.Conflict("The import does not wait for a review");
        }

        var sharing = request.AiDataSharing ?? job.Household.AiDataSharing;
        if (sharing == AiDataSharing.Off)
        {
            return Error.Validation("AI categorization is turned off for this import");
        }

        if (!await aiGate.CanUseAiAsync(job.HouseholdId, currentUser.Id, cancellationToken))
        {
            return Error.Conflict("AI categorization is not available");
        }

        job.StartCategorizing(sharing);
        try
        {
            await queue.SaveChangesAndEnqueueAsync(new CategorizeImport(job.Id), cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Error.Conflict("The import was changed in the meantime");
        }

        return job.ToResponse();
    }
}
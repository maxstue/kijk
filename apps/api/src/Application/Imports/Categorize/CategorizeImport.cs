using Kijk.Application.Imports.Shared;
using Kijk.Application.Imports.Categorization;
using Kijk.Application.Shared.Ai;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Jobs;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Imports.Categorize;

/// <summary>
/// Request for categorizing the rows of an import with the AI.
/// </summary>
/// <param name="AiDataSharing">Which data the AI may see for this import; the space's level when omitted.</param>
/// <param name="SelectedTextKeys">Preview texts selected in the form; existing exclusions are kept when omitted.</param>
public sealed record CategorizeImportRequest(AiDataSharing? AiDataSharing = null, List<string>? SelectedTextKeys = null);

/// <summary>
/// Validates the request for categorizing an import.
/// </summary>
public sealed class CategorizeImportValidator : AbstractValidator<CategorizeImportRequest>
{
    /// <summary>Creates the validator rules.</summary>
    public CategorizeImportValidator()
    {
        RuleFor(request => request.AiDataSharing).IsInEnum().When(request => request.AiDataSharing is not null).WithErrorCode(ErrorCodes.ValidationError);
        RuleFor(request => request.SelectedTextKeys).NotEmpty().When(request => request.SelectedTextKeys is not null).WithErrorCode(ErrorCodes.ValidationError);
        RuleForEach(request => request.SelectedTextKeys).NotEmpty().Matches("^[a-f0-9]{16}$").WithErrorCode(ErrorCodes.ValidationError);
    }
}

/// <summary>
/// Starts the AI categorization of an import waiting for review, e.g. to catch up after the AI was unavailable or to
/// share more than the space default for a single import. Rows with a category are never changed.
/// </summary>
public sealed class CategorizeImportHandler(IAppDbContext dbContext, CurrentUser currentUser, IAiGate aiGate, IJobQueue queue) : IHandler
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
            .Include(item => item.Space)
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (job is null)
        {
            return Error.NotFound("Import could not be found");
        }

        if (job.Status != ImportJobStatus.NeedsReview)
        {
            return Error.Conflict("The import does not wait for a review");
        }

        var sharing = request.AiDataSharing ?? job.Space.AiDataSharing;
        if (sharing == AiDataSharing.Off)
        {
            return Error.Validation("AI categorization is turned off for this import");
        }

        if (!await aiGate.CanUseAiAsync(job.SpaceId, currentUser.Id, cancellationToken))
        {
            return Error.Conflict("AI categorization is not available");
        }

        if (request.SelectedTextKeys is not null)
        {
            var candidates = await AiContexts.Eligible(dbContext, job.Id).ToListAsync(cancellationToken);
            var memberNames = await AiContexts.LoadMemberNamesAsync(dbContext, job.SpaceId, cancellationToken);
            var (contexts, _) = AiContexts.Build(candidates, memberNames);
            var selected = request.SelectedTextKeys.ToHashSet(StringComparer.Ordinal);
            if (!selected.IsSubsetOf(contexts.Select(context => context.Key)))
            {
                return Error.Conflict("The preview changed. Reopen it and check your selection again");
            }

            foreach (var context in contexts)
            {
                foreach (var row in context.Rows)
                {
                    row.SetAiExcluded(!selected.Contains(context.Key));
                }
            }
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
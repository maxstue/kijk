using Kijk.Application.Imports.Categorization;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Imports.AiPreview;

/// <summary>
/// Request for deselecting or selecting a text in the AI preview.
/// </summary>
/// <param name="Excluded">Whether the rows sharing the text stay on the server.</param>
public sealed record UpdateAiPreviewItemRequest(bool Excluded);

/// <summary>
/// Shows exactly what the AI categorization of an import would send and lets the user deselect texts.
/// </summary>
public sealed class ImportAiPreviewHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Gets the texts the AI categorization would send.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The preview, or a not-found error.</returns>
    public async Task<Result<AiPreviewResponse>> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        if (await FindHouseholdAsync(id, cancellationToken) is not { } householdId)
        {
            return Error.NotFound("Import could not be found");
        }

        var (contexts, withheld) = await BuildAsync(id, householdId, cancellationToken);
        return new AiPreviewResponse(
            [
                .. contexts.Select(context => new AiPreviewItemResponse(
                    context.Key,
                    context.Item.Counterparty,
                    context.Item.Purpose,
                    context.Item.IsIncome,
                    context.Rows.Count,
                    context.Rows.TrueForAll(row => row.AiExcluded)))
            ],
            withheld);
    }

    /// <summary>Deselects or selects all rows that share a text.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="key">The key of the text from the preview.</param>
    /// <param name="request">The change.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The changed item, or a not-found or conflict error.</returns>
    public async Task<Result<AiPreviewItemResponse>> UpdateAsync(Guid id, string key, UpdateAiPreviewItemRequest request, CancellationToken cancellationToken)
    {
        var job = await dbContext.ImportJobs
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (job is null)
        {
            return Error.NotFound("Import could not be found");
        }

        if (job.Status != ImportJobStatus.NeedsReview)
        {
            return Error.Conflict("The import does not wait for a review");
        }

        var (contexts, _) = await BuildAsync(id, job.HouseholdId, cancellationToken);
        var context = contexts.Find(item => item.Key == key);
        if (context is null)
        {
            return Error.NotFound("The text is not part of the preview");
        }

        foreach (var row in context.Rows)
        {
            row.SetAiExcluded(request.Excluded);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return new AiPreviewItemResponse(key, context.Item.Counterparty, context.Item.Purpose, context.Item.IsIncome, context.Rows.Count, request.Excluded);
    }

    private async Task<(List<AiContext> Contexts, int Withheld)> BuildAsync(Guid id, Guid householdId, CancellationToken cancellationToken)
    {
        var candidates = await AiContexts.Eligible(dbContext, id).ToListAsync(cancellationToken);
        var memberNames = await AiContexts.LoadMemberNamesAsync(dbContext, householdId, cancellationToken);
        return AiContexts.Build(candidates, memberNames);
    }

    private Task<Guid?> FindHouseholdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.ImportJobs
            .Where(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId)
            .Select(item => (Guid?)item.HouseholdId)
            .FirstOrDefaultAsync(cancellationToken);
}
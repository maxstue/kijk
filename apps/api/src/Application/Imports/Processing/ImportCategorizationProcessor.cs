using Kijk.Application.Imports.Categorization;
using Kijk.Application.Shared.Ai;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Imports.Processing;

/// <summary>
/// Runs the AI categorization step of an import. It can run again after a crash and never logs transaction texts.
/// </summary>
public sealed class ImportCategorizationProcessor(
    IAppDbContext dbContext,
    ITransactionCategorizer categorizer,
    IAiGate aiGate,
    ILogger<ImportCategorizationProcessor> logger) : IHandler
{
    /// <summary>
    /// Proposes categories for the candidates that have none. Only sanitized text leaves the server, identical
    /// contexts are asked once, rows deselected in the preview and card statements are skipped, and categories from
    /// corrections, rules or the user are never touched. A failure keeps
    /// all rows and leaves them uncategorized.
    /// </summary>
    /// <param name="importJobId">The import.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the step is done.</returns>
    public async Task CategorizeAsync(Guid importJobId, CancellationToken cancellationToken)
    {
        var job = await dbContext.ImportJobs.FirstOrDefaultAsync(item => item.Id == importJobId, cancellationToken);
        if (job is null || job.Status != ImportJobStatus.Categorizing)
        {
            return;
        }

        try
        {
            var count = 0;
            var unavailable = false;
            // The worker checks everything again: permission, the space's level and the AI gate.
            var allowed = job.AiDataSharing == AiDataSharing.Strict
                          && await dbContext.AuthorizeSpaceAsync(job.CreatedById, job.SpaceId, SpacePermissions.Finances.Import, cancellationToken) is null
                          && await aiGate.CanUseAiAsync(job.SpaceId, job.CreatedById, cancellationToken);
            if (allowed)
            {
                (count, unavailable) = await CategorizeCandidatesAsync(job, cancellationToken);
            }

            job.FinishCategorizing(count, unavailable);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning("Categorizing import {ImportJobId} failed with {ExceptionType}", job.Id, exception.GetType().Name);
            // A cancelled import stays cancelled; otherwise the rows wait for the review without categories.
            await dbContext.ImportJobs
                .Where(item => item.Id == importJobId && item.Status == ImportJobStatus.Categorizing)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(item => item.Status, ImportJobStatus.NeedsReview)
                        .SetProperty(item => item.AiCategorizationUnavailable, true),
                    cancellationToken);
        }
    }

    private async Task<(int Count, bool Unavailable)> CategorizeCandidatesAsync(ImportJob job, CancellationToken cancellationToken)
    {
        // Rows the user deselected in the preview stay on the server.
        var candidates = await AiContexts.Eligible(dbContext, job.Id)
            .Where(item => !item.AiExcluded)
            .ToListAsync(cancellationToken);
        if (candidates.Count == 0)
        {
            return (0, false);
        }

        var memberNames = await AiContexts.LoadMemberNamesAsync(dbContext, job.SpaceId, cancellationToken);
        var categories = await dbContext.Categories
            .Where(item => item.CreatorType == CreatorType.System || item.SpaceId == job.SpaceId)
            .OrderBy(item => item.Name)
            .Select(item => new CategoryOption(item.Id, item.Name, item.Kind))
            .ToListAsync(cancellationToken);

        // Identical sanitized contexts are asked only once; the answer applies to every matching row.
        var (contexts, _) = AiContexts.Build(candidates, memberNames);
        var result = await categorizer.CategorizeAsync(
            job.SpaceId,
            job.CreatedById,
            [.. contexts.Select(context => context.Item)],
            categories,
            cancellationToken);

        var categorized = 0;
        foreach (var context in contexts)
        {
            if (!result.Assignments.TryGetValue(context.Item.Id, out var categoryId))
            {
                continue;
            }

            foreach (var row in context.Rows)
            {
                row.ProposeCategory(categoryId, CategorySource.Ai);
                categorized++;
            }
        }

        return (categorized, result.Unavailable);
    }
}
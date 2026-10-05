using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Shared;

namespace Kijk.Application.Imports.Commit;

/// <summary>
/// Request for committing an import.
/// </summary>
/// <param name="IncludedEdgeMonths">Edge months the file covers completely and that should be replaced too.</param>
/// <param name="AcceptErrors">Confirms committing although many rows could not be parsed.</param>
public sealed record CommitImportRequest(List<DateOnly> IncludedEdgeMonths, bool AcceptErrors);

/// <summary>
/// Replaces the account's transactions in the covered months with the reviewed rows, in one database transaction.
/// Committing twice has no further effect.
/// </summary>
public sealed class CommitImportHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    /// <summary>Commits an import.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="request">The review decisions.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The completed import, or a not-found, validation or conflict error.</returns>
    public async Task<Result<ImportJobResponse>> CommitAsync(Guid id, CommitImportRequest request, CancellationToken cancellationToken)
    {
        var job = await dbContext.ImportJobs
            .Include(item => item.Account)
            .Include(item => item.Household)
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (job is null)
        {
            return Error.NotFound("Import could not be found");
        }

        if (job.Status == ImportJobStatus.Done)
        {
            return job.ToResponse();
        }

        if (job.Status != ImportJobStatus.NeedsReview)
        {
            return Error.Conflict("The import does not wait for a review");
        }

        if (job.HasHighErrorRate && !request.AcceptErrors)
        {
            return Error.Validation($"{job.ErrorCount} of {job.RowCount} rows could not be read; confirm to import the rest");
        }

        var user = await dbContext.Users.FirstAsync(item => item.Id == currentUser.Id, cancellationToken);
        var included = request.IncludedEdgeMonths
            .Select(month => new DateTime(month.Year, month.Month, 1, 0, 0, 0, DateTimeKind.Utc))
            .ToHashSet();
        var months = job.FullMonths.Concat(job.EdgeMonths.Where(included.Contains)).ToHashSet();
        var skipped = job.EdgeMonths.Where(month => !included.Contains(month)).ToList();

        var candidates = await dbContext.ImportCandidates.Where(item => item.ImportJobId == job.Id).ToListAsync(cancellationToken);
        var imported = candidates
            .Where(item => item is { Excluded: false, IsValid: true } && months.Contains(MonthOf(item.BookingDate!.Value)))
            .ToList();
        await ReplaceTransactionsAsync(job, months, imported, user, cancellationToken);

        dbContext.ImportCandidates.RemoveRange(candidates);
        dbContext.ImportFiles.RemoveRange(await dbContext.ImportFiles.Where(item => item.ImportJobId == job.Id).ToListAsync(cancellationToken));
        job.Complete(months.Order(), skipped, imported.Count, timeProvider.GetUtcNow().UtcDateTime);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another request committed or cancelled the import in the meantime; report the state it left.
            var current = await dbContext.ImportJobs.Include(item => item.Account).AsNoTracking().FirstAsync(item => item.Id == id, cancellationToken);
            return current.Status == ImportJobStatus.Done ? current.ToResponse() : Error.Conflict("The import was changed in the meantime");
        }

        return job.ToResponse();
    }

    private async Task ReplaceTransactionsAsync(
        ImportJob job,
        HashSet<DateTime> months,
        List<ImportCandidate> imported,
        User user,
        CancellationToken cancellationToken)
    {
        if (months.Count == 0)
        {
            return;
        }

        var from = months.Min();
        var to = months.Max().AddMonths(1);
        var existing = await dbContext.Transactions
            .Where(item => item.HouseholdId == job.HouseholdId
                           && item.AccountId == job.AccountId
                           && item.BookingDate >= from
                           && item.BookingDate < to)
            .ToListAsync(cancellationToken);
        dbContext.Transactions.RemoveRange(existing.Where(item => months.Contains(MonthOf(item.BookingDate))));

        var categoryIds = imported.Select(item => item.CategoryId).OfType<Guid>().ToHashSet();
        var categories = await dbContext.GetAvailableCategories(currentUser)
            .Where(item => categoryIds.Contains(item.Id))
            .ToDictionaryAsync(item => item.Id, cancellationToken);
        foreach (var candidate in imported)
        {
            var transaction = Transaction.CreateImported(
                new TransactionDetails(
                    candidate.BookingDate!.Value,
                    candidate.Amount!.Value,
                    candidate.Counterparty,
                    PurposeScrubber.ApplyRetention(candidate.Purpose, job.Household.PurposeRetention),
                    candidate.Status,
                    IsTransfer: false),
                new TransactionKeys(candidate.BookingKey!, candidate.CounterpartyKey, job.KeyVersion, candidate.IsMerchantPayment),
                job.Account,
                job,
                user,
                job.Household);

            if (candidate.CategoryId is { } categoryId && categories.TryGetValue(categoryId, out var category))
            {
                if (candidate.CategorySource == CategorySource.Manual)
                {
                    transaction.AssignCategoryManually(category);
                }
                else
                {
                    transaction.AssignCategoryAutomatically(category, candidate.CategorySource ?? CategorySource.Rule);
                }
            }

            dbContext.Transactions.Add(transaction);
        }
    }

    private static DateTime MonthOf(DateTime date) => new(date.Year, date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
}
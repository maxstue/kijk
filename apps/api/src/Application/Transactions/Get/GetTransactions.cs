using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Transactions.Shared;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Get;

/// <summary>
/// Retrieves transactions of the active space.
/// </summary>
public sealed class GetTransactionsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>The page size when the request names none.</summary>
    public const int DefaultPageSize = 25;

    /// <summary>The largest page size a request may ask for.</summary>
    public const int MaxPageSize = 200;

    /// <summary>Gets a page of the transactions of the active space, newest first.</summary>
    /// <param name="filter">The period and category filters.</param>
    /// <param name="page">The 1-based page number; values past the last page return the last page.</param>
    /// <param name="pageSize">The page size (1-<see cref="MaxPageSize" />).</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The page, or a validation error for an invalid filter.</returns>
    public async Task<Result<TransactionPageResponse>> GetPageAsync(
        TransactionFilter filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (filter.Validate() is { } error)
        {
            return error;
        }

        var query = filter.Apply(dbContext.GetVisibleTransactions(currentUser)
            .Where(transaction => transaction.SpaceId == currentUser.ActiveSpaceId));

        // Count and totals cover every matching transaction, not only the page.
        var summary = await query
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Count = group.Count(),
                Incoming = group.Sum(transaction => transaction.Amount > 0 ? transaction.Amount : 0m),
                Outgoing = group.Sum(transaction => transaction.Amount < 0 ? transaction.Amount : 0m),
            })
            .SingleOrDefaultAsync(cancellationToken);
        var totalCount = summary?.Count ?? 0;

        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        // Categorizing or deleting on the last page can empty it; return the new last page instead of nothing.
        var lastPage = Math.Max(1, (totalCount + pageSize - 1) / pageSize);
        page = Math.Clamp(page, 1, lastPage);

        var transactions = await query
            .Include(transaction => transaction.Account)
            .Include(transaction => transaction.Category)
            .OrderByDescending(transaction => transaction.BookingDate)
            .ThenByDescending(transaction => transaction.CreatedAt)
            .ThenByDescending(transaction => transaction.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return new TransactionPageResponse(
            transactions.Select(transaction => transaction.ToResponse()).ToList(),
            totalCount,
            page,
            pageSize,
            summary?.Incoming ?? 0m,
            summary?.Outgoing ?? 0m);
    }

    /// <summary>Gets a transaction of the active space.</summary>
    /// <param name="id">The transaction id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The transaction, or a not-found error.</returns>
    public async Task<Result<TransactionResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var transaction = await dbContext.GetVisibleTransactions(currentUser)
            .Include(item => item.Account)
            .Include(item => item.Category)
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);

        return transaction is null ? Error.NotFound("Transaction could not be found") : transaction.ToResponse();
    }
}
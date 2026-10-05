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
    /// <summary>Gets the transactions of the active space, newest first.</summary>
    /// <param name="year">The year, or <see langword="null" /> for all years.</param>
    /// <param name="month">The month (1-12), or <see langword="null" /> for the whole year. Requires a year.</param>
    /// <param name="uncategorized">When <see langword="true" />, only transactions without a category.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The transactions, or a validation error for an invalid period.</returns>
    public async Task<Result<List<TransactionResponse>>> GetAllAsync(
        int? year,
        int? month,
        bool? uncategorized,
        CancellationToken cancellationToken)
    {
        if (year is < 2000 or > 9999 || month is < 1 or > 12 || month is not null && year is null)
        {
            return Error.Validation("Year or month is invalid");
        }

        var query = dbContext.GetVisibleTransactions(currentUser)
            .Include(transaction => transaction.Account)
            .Include(transaction => transaction.Category)
            .Where(transaction => transaction.SpaceId == currentUser.ActiveSpaceId);

        if (year is { } selectedYear)
        {
            var start = new DateTime(selectedYear, month ?? 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = month is null ? start.AddYears(1) : start.AddMonths(1);
            query = query.Where(transaction => transaction.BookingDate >= start && transaction.BookingDate < end);
        }

        if (uncategorized is true)
        {
            query = query.Where(transaction => transaction.CategoryId == null);
        }

        var transactions = await query
            .OrderByDescending(transaction => transaction.BookingDate)
            .ThenByDescending(transaction => transaction.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return transactions.Select(transaction => transaction.ToResponse()).ToList();
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
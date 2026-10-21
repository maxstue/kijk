using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Shared;

/// <summary>
/// The filters of the transaction list and export.
/// </summary>
/// <param name="Year">The year, or <see langword="null" /> for all years.</param>
/// <param name="Month">The month (1-12), or <see langword="null" /> for the whole year. Requires a year.</param>
/// <param name="Uncategorized">When <see langword="true" />, only transactions without a category.</param>
/// <param name="CategoryIds">When not empty, only transactions in one of these categories.</param>
public sealed record TransactionFilter(int? Year, int? Month, bool? Uncategorized, IReadOnlyCollection<Guid>? CategoryIds)
{
    /// <summary>The most categories a filter may name.</summary>
    public const int MaxCategoryIds = 50;

    /// <summary>Checks the period and the number of categories.</summary>
    /// <returns>A validation error, or <see langword="null" /> when the filter is valid.</returns>
    public Error? Validate()
    {
        if (Year is < 2000 or > 9999 || Month is < 1 or > 12 || Month is not null && Year is null)
        {
            return Error.Validation("Year or month is invalid");
        }

        return CategoryIds?.Count > MaxCategoryIds
            ? Error.Validation($"At most {MaxCategoryIds} categories can be filtered at once")
            : null;
    }

    /// <summary>Restricts <paramref name="query" /> to the transactions matching the filter.</summary>
    /// <param name="query">The visible transactions of the active space.</param>
    /// <returns>The filtered query.</returns>
    public IQueryable<Transaction> Apply(IQueryable<Transaction> query)
    {
        if (Year is { } year)
        {
            var start = new DateTime(year, Month ?? 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = Month is null ? start.AddYears(1) : start.AddMonths(1);
            query = query.Where(transaction => transaction.BookingDate >= start && transaction.BookingDate < end);
        }

        if (Uncategorized is true)
        {
            query = query.Where(transaction => transaction.CategoryId == null);
        }

        if (CategoryIds is { Count: > 0 } categoryIds)
        {
            query = query.Where(transaction => transaction.CategoryId != null && categoryIds.Contains(transaction.CategoryId.Value));
        }

        return query;
    }
}
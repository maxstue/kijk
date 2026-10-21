namespace Kijk.Application.Transactions.Shared;

/// <summary>
/// A server-side page of transactions, newest first.
/// </summary>
/// <param name="Items">The transactions of the page.</param>
/// <param name="TotalCount">The number of transactions matching the filters.</param>
/// <param name="Page">The 1-based page number; clamped to the last page when the requested one is past the end.</param>
/// <param name="PageSize">The page size.</param>
/// <param name="Incoming">The sum of all incoming amounts matching the filters, across all pages.</param>
/// <param name="Outgoing">The sum of all outgoing amounts matching the filters, across all pages; zero or negative.</param>
public sealed record TransactionPageResponse(
    IReadOnlyList<TransactionResponse> Items,
    int TotalCount,
    int Page,
    int PageSize,
    decimal Incoming,
    decimal Outgoing);
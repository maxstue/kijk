namespace Kijk.Application.Shared.Paging;

/// <summary>
/// Optional search, sort and page of a list endpoint. Without a page and page size the list returns every matching row,
/// e.g. for selects; tables send both.
/// </summary>
/// <typeparam name="TSort">The columns the list can be sorted by.</typeparam>
/// <param name="Search">An optional text the rows must contain, ignoring case.</param>
/// <param name="Sort">The column to sort by; the list's default order when omitted.</param>
/// <param name="Descending">Whether to sort in descending order.</param>
/// <param name="Page">The 1-based page number; values past the last page return the last page.</param>
/// <param name="PageSize">The page size (1-100); 10 when only a page is given, all rows when both are omitted.</param>
public sealed record ListRequest<TSort>(
    string? Search = null,
    TSort? Sort = null,
    bool Descending = false,
    int? Page = null,
    int? PageSize = null)
    where TSort : struct, Enum;
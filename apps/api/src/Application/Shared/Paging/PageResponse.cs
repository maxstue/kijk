namespace Kijk.Application.Shared.Paging;

/// <summary>
/// The rows of a list endpoint; a single page holding every row when the request names no page.
/// </summary>
/// <typeparam name="T">The row type.</typeparam>
/// <param name="Items">The rows of the page.</param>
/// <param name="TotalCount">The number of rows matching the search, across all pages.</param>
/// <param name="Page">The 1-based page number; clamped to the last page when the requested one is past the end.</param>
/// <param name="PageSize">The page size; the number of rows when the request names no page.</param>
public sealed record PageResponse<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);
using System.Linq.Expressions;

namespace Kijk.Application.Shared.Paging;

/// <summary>
/// Searches and pages list queries.
/// </summary>
public static class PagingExtensions
{
    /// <summary>The page size when the request names a page but no size.</summary>
    public const int DefaultPageSize = 10;

    /// <summary>The largest page size a request may ask for.</summary>
    public const int MaxPageSize = 100;

    /// <summary>The longest search text that is applied; longer texts are cut.</summary>
    public const int MaxSearchLength = 200;

    /// <summary>The escape character of <see cref="ToContainsPattern" />.</summary>
    public const string LikeEscape = "\\";

    /// <summary>
    /// Builds a LIKE pattern that matches values containing the trimmed search text; escaping keeps user-entered
    /// wildcards literal.
    /// </summary>
    /// <param name="search">The search text.</param>
    /// <returns>The pattern, or <see langword="null" /> when the search is empty.</returns>
    public static string? ToContainsPattern(this string? search)
    {
        if (string.IsNullOrWhiteSpace(search))
        {
            return null;
        }

        var term = search.Trim();
        term = term[..Math.Min(term.Length, MaxSearchLength)]
            .Replace(LikeEscape, LikeEscape + LikeEscape, StringComparison.Ordinal)
            .Replace("%", LikeEscape + "%", StringComparison.Ordinal)
            .Replace("_", LikeEscape + "_", StringComparison.Ordinal);
        return $"%{term}%";
    }

    /// <summary>Orders a query ascending or descending by a key.</summary>
    /// <param name="query">The query.</param>
    /// <param name="key">The sort key.</param>
    /// <param name="descending">Whether to sort in descending order.</param>
    /// <returns>The ordered query.</returns>
    public static IOrderedQueryable<T> OrderBy<T, TKey>(this IQueryable<T> query, Expression<Func<T, TKey>> key, bool descending) =>
        descending ? query.OrderByDescending(key) : Queryable.OrderBy(query, key);

    /// <summary>Loads one page of an ordered query, or all its rows when no page is requested.</summary>
    /// <param name="query">The searched and ordered query; it needs a unique tie-breaker for stable pages.</param>
    /// <param name="page">The 1-based page number; values past the last page return the last page.</param>
    /// <param name="pageSize">The page size; <see cref="DefaultPageSize" /> when only a page is given.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The page.</returns>
    public static async Task<PageResponse<T>> ToPageAsync<T>(
        this IQueryable<T> query,
        int? page,
        int? pageSize,
        CancellationToken cancellationToken)
    {
        if (page is null && pageSize is null)
        {
            var rows = await query.ToListAsync(cancellationToken);
            return new PageResponse<T>(rows, rows.Count, 1, rows.Count);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var (pageNumber, size) = Clamp(totalCount, page, pageSize);
        var items = await query.Skip((pageNumber - 1) * size).Take(size).ToListAsync(cancellationToken);
        return new PageResponse<T>(items, totalCount, pageNumber, size);
    }

    /// <summary>Maps the rows of a page.</summary>
    /// <param name="page">The page.</param>
    /// <param name="map">Maps one row.</param>
    /// <returns>The page with mapped rows.</returns>
    public static PageResponse<TResult> Map<T, TResult>(this PageResponse<T> page, Func<T, TResult> map) =>
        new(page.Items.Select(map).ToList(), page.TotalCount, page.Page, page.PageSize);

    // Deleting the last row of the last page would otherwise return an empty page.
    private static (int Page, int PageSize) Clamp(int totalCount, int? page, int? pageSize)
    {
        var size = Math.Clamp(pageSize ?? DefaultPageSize, 1, MaxPageSize);
        var lastPage = Math.Max(1, (totalCount + size - 1) / size);
        return (Math.Clamp(page ?? 1, 1, lastPage), size);
    }
}
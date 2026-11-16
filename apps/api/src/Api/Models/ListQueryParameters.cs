using Kijk.Application.Shared.Paging;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Models;

/// <summary>HTTP query parameters with explicit names and optional defaults.</summary>
/// <typeparam name="TSort">Supported sort columns.</typeparam>
/// <param name="Search">Optional text to match in the searchable fields.</param>
/// <param name="Sort">The supported sort column; omitted uses the feature default.</param>
/// <param name="Descending">Whether the selected column is sorted in descending order.</param>
/// <param name="Page">The one-based page number.</param>
/// <param name="PageSize">The requested rows per page, bounded by the application.</param>
public sealed record ListQueryParameters<TSort>(
    [property: FromQuery(Name = "search")] string? Search = null,
    [property: FromQuery(Name = "sort")] TSort? Sort = null,
    [property: FromQuery(Name = "descending")] bool Descending = false,
    [property: FromQuery(Name = "page")] int? Page = null,
    [property: FromQuery(Name = "pageSize")] int? PageSize = null) where TSort : struct, Enum
{
    /// <summary>Maps the HTTP parameters to the application list request.</summary>
    public ListRequest<TSort> ToRequest() => new(Search, Sort, Descending, Page, PageSize);
}
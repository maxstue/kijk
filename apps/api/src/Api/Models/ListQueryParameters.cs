using Kijk.Application.Shared.Paging;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Models;

/// <summary>HTTP query parameters with explicit names and optional defaults.</summary>
/// <typeparam name="TSort">Supported sort columns.</typeparam>
/// <param name="Search">Optional text to match in the searchable fields.</param>
/// <param name="Sort">The supported sort column; omitted uses the feature default.</param>
/// <param name="Descending">Whether the selected column is sorted in descending order.</param>
public sealed record ListQueryParameters<TSort>(
    [property: FromQuery(Name = "search")] string? Search = null,
    [property: FromQuery(Name = "sort")] TSort? Sort = null,
    [property: FromQuery(Name = "descending")] bool Descending = false) where TSort : struct, Enum
{
    /// <summary>Maps the HTTP parameters to the application list request; without a page the list returns every row.</summary>
    public ListRequest<TSort> ToRequest(PageParameters paging) => new(Search, Sort, Descending, paging.Page, paging.PageSize);
}
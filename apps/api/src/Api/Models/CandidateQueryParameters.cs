using Kijk.Application.Imports.Queries;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Models;

/// <summary>HTTP query parameters with explicit names and optional defaults.</summary>
/// <param name="Page">The one-based page number.</param>
/// <param name="PageSize">The requested rows per page, bounded by the application.</param>
/// <param name="Months">Comma-separated first days of the selected import months.</param>
/// <param name="CardSettlementsOnly">Whether to show only included, readable card statements.</param>
/// <param name="Search">Optional text to match in the searchable fields.</param>
/// <param name="Filter">An optional display-only review filter.</param>
public sealed record CandidateQueryParameters(
    [property: FromQuery(Name = "page")] int Page = 1,
    [property: FromQuery(Name = "pageSize")] int PageSize = 100,
    [property: FromQuery(Name = "months")] string? Months = null,
    [property: FromQuery(Name = "cardSettlementsOnly")] bool CardSettlementsOnly = false,
    [property: FromQuery(Name = "search")] string? Search = null,
    [property: FromQuery(Name = "filter")] CandidateFilter? Filter = null)
{
    /// <summary>Maps the HTTP parameters to the application review request.</summary>
    public CandidatesRequest ToRequest() => new(Page, PageSize, Months, CardSettlementsOnly, Search, Filter);
}
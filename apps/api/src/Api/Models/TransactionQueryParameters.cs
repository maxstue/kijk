using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Models;

/// <summary>HTTP query parameters with explicit names and optional defaults.</summary>
/// <param name="Year">The year to restrict the transactions to.</param>
/// <param name="Month">The month within the selected year.</param>
/// <param name="Uncategorized">Whether to include only transactions without a category.</param>
/// <param name="CategoryIds">The categories to include in the transaction selection.</param>
/// <param name="Search">Optional text to match in the searchable fields.</param>
/// <param name="Page">The one-based page number.</param>
/// <param name="PageSize">The requested rows per page, bounded by the application.</param>
public sealed record TransactionQueryParameters(
    [property: FromQuery(Name = "year")] int? Year = null,
    [property: FromQuery(Name = "month")] int? Month = null,
    [property: FromQuery(Name = "uncategorized")] bool? Uncategorized = null,
    [property: FromQuery(Name = "categoryIds")] Guid[]? CategoryIds = null,
    [property: FromQuery(Name = "search")] string? Search = null,
    [property: FromQuery(Name = "page")] int? Page = null,
    [property: FromQuery(Name = "pageSize")] int? PageSize = null);
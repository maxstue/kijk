using Kijk.Application.Transactions.Shared;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Models;

/// <summary>HTTP query parameters of the transaction filters, shared by the list and the export.</summary>
/// <param name="Year">The year to restrict the transactions to.</param>
/// <param name="Month">The month within the selected year.</param>
/// <param name="Uncategorized">Whether to include only transactions without a category.</param>
/// <param name="CategoryIds">The categories to include in the transaction selection.</param>
/// <param name="Search">Optional text to match in the counterparty or purpose.</param>
public sealed record TransactionFilterParameters(
    [property: FromQuery(Name = "year")] int? Year = null,
    [property: FromQuery(Name = "month")] int? Month = null,
    [property: FromQuery(Name = "uncategorized")] bool? Uncategorized = null,
    [property: FromQuery(Name = "categoryIds")] Guid[]? CategoryIds = null,
    [property: FromQuery(Name = "search")] string? Search = null)
{
    /// <summary>Maps the HTTP parameters to the application filter.</summary>
    public TransactionFilter ToFilter() => new(Year, Month, Uncategorized, CategoryIds, Search);
}
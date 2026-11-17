using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Models;

/// <summary>HTTP query parameters of the requested page, shared by all paged endpoints.</summary>
/// <param name="Page">The one-based page number; values past the last page return the last page.</param>
/// <param name="PageSize">The requested rows per page, bounded by the application.</param>
public sealed record PageParameters(
    [property: FromQuery(Name = "page")] int? Page = null,
    [property: FromQuery(Name = "pageSize")] int? PageSize = null);
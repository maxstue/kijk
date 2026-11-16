namespace Kijk.Application.Imports.Queries;

/// <summary>The columns of the import history.</summary>
public enum ImportSort
{
    /// <summary>Upload time; also the order when no sort is requested.</summary>
    CreatedAt,
    /// <summary>Uploaded file name.</summary>
    FileName,
    /// <summary>Account name.</summary>
    Account
}

/// <summary>A review-only filter; never changes which rows are committed.</summary>
public enum CandidateFilter
{
    /// <summary>Readable rows without a category.</summary>
    Uncategorized,
    /// <summary>Rows with parsing errors.</summary>
    Errors,
    /// <summary>Rows excluded from import.</summary>
    Excluded
}
/// <summary>Display filters and paging for import review, independent of commit selection.</summary>
/// <param name="Page">One-based page.</param>
/// <param name="PageSize">Maximum rows per page.</param>
/// <param name="Months">Selected months, comma-separated.</param>
/// <param name="CardSettlementsOnly">Whether to display included card statements only.</param>
/// <param name="Search">Counterparty or purpose search.</param>
/// <param name="Filter">An optional review filter.</param>
public sealed record CandidatesRequest(int Page = 1, int PageSize = CandidatesRequest.DefaultPageSize, string? Months = null,
    bool CardSettlementsOnly = false, string? Search = null, CandidateFilter? Filter = null)
{
    /// <summary>The page size when the request names none.</summary>
    public const int DefaultPageSize = 100;
}
namespace Kijk.Application.Imports.Queries;

/// <summary>The columns of the import history.</summary>
public enum ImportSort
{
    /// <summary>Upload time.</summary>
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
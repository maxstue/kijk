namespace Kijk.Application.Imports.Shared;

/// <summary>
/// Limits that keep imports small enough for the database and the processing budget.
/// </summary>
public static class ImportLimits
{
    /// <summary>The maximum file size in bytes (5 MB).</summary>
    public const int MaxFileBytes = 5 * 1024 * 1024;

    /// <summary>The maximum number of data rows per file.</summary>
    public const int MaxRows = 20_000;

    /// <summary>The number of rows shown in the mapping preview.</summary>
    public const int PreviewRows = 10;

    /// <summary>The maximum length of a stored file name.</summary>
    public const int FileNameMaximumLength = 200;
}
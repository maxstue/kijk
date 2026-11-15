namespace Kijk.Application.Consumptions.Import;

/// <summary>
/// Limits that keep a consumption import small enough to run within a single request.
/// </summary>
public static class ConsumptionImportLimits
{
    /// <summary>The maximum file size in bytes (1 MB).</summary>
    public const int MaxFileBytes = 1024 * 1024;

    /// <summary>The maximum number of data rows per file.</summary>
    public const int MaxRows = 10_000;

    /// <summary>The maximum number of row errors returned to the client.</summary>
    public const int ErrorSamples = 50;
}
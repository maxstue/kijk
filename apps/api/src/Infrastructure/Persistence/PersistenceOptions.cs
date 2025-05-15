using Kijk.Shared;

namespace Kijk.Infrastructure.Persistence;

/// <summary>
/// Configuration options for persistence settings.
/// </summary>
public class PersistenceOptions : IConfigOptions
{
    public static string SectionName => "Persistence";

    /// <summary>
    /// Enables or disales the use of slow query logging.
    /// </summary>
    public bool SlowQueryLoggingEnabled { get; set; }

    /// <summary>
    /// The threshold in milliseconds for a query to be considered slow.
    /// </summary>
    public int SlowQueryThreshold { get; set; } = 1000; // in milliseconds
}
using System.ComponentModel.DataAnnotations;

namespace Kijk.Infrastructure.Persistence;

/// <summary>
/// Configuration options for persistence settings.
/// </summary>
public class PersistenceOptions
{
    /// <summary>Gets the configuration section name.</summary>
    public static string SectionName => "Persistence";

    /// <summary>
    /// Gets or sets whether slow query logging is enabled.
    /// </summary>
    public bool SlowQueryLoggingEnabled { get; set; }

    /// <summary>
    /// Gets or sets the threshold in milliseconds for a query to be considered slow.
    /// </summary>
    [Range(0, int.MaxValue)]
    public int SlowQueryThreshold { get; set; } = 1000; // in milliseconds
}
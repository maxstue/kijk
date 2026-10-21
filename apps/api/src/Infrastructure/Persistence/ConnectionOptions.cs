using Kijk.Infrastructure.Configuration;

namespace Kijk.Infrastructure.Persistence;

/// <summary>
/// PostgreSQL connection settings from the ConnectionStrings section.
/// </summary>
public class ConnectionOptions
{
    /// <summary>Gets the configuration section name.</summary>
    public static string SectionName => "ConnectionStrings";

    /// <summary>Gets or sets the PostgreSQL connection string.</summary>
    [PostgresConnectionString]
    public string DefaultConnection { get; set; } = string.Empty;
}
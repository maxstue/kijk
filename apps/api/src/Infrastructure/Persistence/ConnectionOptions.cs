using Kijk.Shared;

namespace Kijk.Infrastructure.Persistence;

/// <summary>
/// Binds the DefaultConnection configuration section to the ConnectionOptions class.
/// </summary>
public class ConnectionOptions : IConfigOptions
{
    /// <inheritdoc />
    public static string SectionName => "DefaultConnection";

}
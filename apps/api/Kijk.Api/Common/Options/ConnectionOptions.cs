namespace Kijk.Api.Common.Options;

/// <summary>
/// Binds the DefaultConnection configuration section to the ConnectionOptions class.
/// </summary>
public class ConnectionOptions : IConfigOptions
{
    public static string SectionName => "DefaultConnection";
}

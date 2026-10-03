namespace Kijk.Shared;

/// <summary>
/// Interface for configuration options.
/// </summary>
public interface IConfigOptions
{
    /// <summary>Gets the configuration section the options bind to.</summary>
    static abstract string SectionName { get; }
}
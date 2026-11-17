namespace Kijk.Application.Resources.List;

/// <summary>
/// The columns the resource list can be sorted by.
/// </summary>
public enum ResourceSort
{
    /// <summary>By name.</summary>
    Name,
    /// <summary>By unit symbol, then by name.</summary>
    Unit,
    /// <summary>By color, then by name.</summary>
    Color,
    /// <summary>By creator type (system or custom), then by name.</summary>
    CreatorType
}
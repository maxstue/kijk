namespace Kijk.Application.Categories.List;

/// <summary>
/// The columns the category list can be sorted by.
/// </summary>
public enum CategorySort
{
    /// <summary>By name.</summary>
    Name,
    /// <summary>By kind (expenses first), then by name.</summary>
    Kind,
    /// <summary>By creator type (system or custom), then by name.</summary>
    CreatorType
}
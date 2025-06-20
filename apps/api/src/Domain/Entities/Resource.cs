using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// Represents a resource that can be consumed by a household.
/// </summary>
public class Resource : BaseEntity
{
    /// <summary>
    /// Name of the resource (e.g., "Water", "Gas")
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Unit of measurement (e.g., "Liters", "kWh")
    /// </summary>
    public string Unit { get; set; } = null!;

    /// <summary>
    /// A color which represents the category.
    /// IMPORTANT: needs to be a hex-color.
    /// </summary>
    public required string Color { get; set; }

    /// <summary>
    /// Indicates who created the resource.
    /// A 'User' or 'System'.
    /// </summary>
    public required CreatorType CreatorType { get; set; }
}
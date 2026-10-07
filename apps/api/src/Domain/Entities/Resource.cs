using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// Represents a resource that can be consumed by a space.
/// </summary>
public class Resource : BaseEntity
{
    /// <summary>
    /// Name of the resource (e.g., "Water", "Gas")
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Identifier of the unit used by this resource.
    /// </summary>
    public Guid UnitId { get; set; }

    /// <summary>
    /// Unit used by this resource.
    /// </summary>
    public required Unit Unit { get; set; }

    /// <summary>
    /// A color which represents the category.
    /// IMPORTANT: needs to be a hex-color.
    /// </summary>
    public required string Color { get; set; }

    /// <summary>
    /// Gets or sets the Lucide icon name used to represent the resource.
    /// </summary>
    public required string Icon { get; set; }

    /// <summary>
    /// Indicates who created the resource.
    /// A 'User' or 'System'.
    /// </summary>
    public required CreatorType CreatorType { get; set; }

    /// <summary>
    /// Gets the space that owns a custom resource. System resources are global and therefore have no space.
    /// </summary>
    public Guid? SpaceId { get; set; }

    /// <summary>
    /// Gets the space that owns a custom resource.
    /// </summary>
    public Space? Space { get; set; }
}
using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// Groups transactions for budgets and statistics. System categories are global, custom categories belong to a household.
/// </summary>
public sealed class Category : BaseEntity
{
    /// <summary>Gets or sets the display name.</summary>
    public required string Name { get; set; }

    /// <summary>Gets or sets the Lucide icon name used to represent the category.</summary>
    public required string Icon { get; set; }

    /// <summary>
    /// Gets or sets a color which represents the category.
    /// IMPORTANT: needs to be a hex-color.
    /// </summary>
    public required string Color { get; set; }

    /// <summary>Gets or sets whether the category groups expenses or income.</summary>
    public required CategoryKind Kind { get; set; }

    /// <summary>Gets or sets who created the category.</summary>
    public required CreatorType CreatorType { get; set; }

    /// <summary>Gets or sets the household that owns a custom category. System categories have no household.</summary>
    public Guid? HouseholdId { get; set; }

    /// <summary>Gets or sets the household that owns a custom category.</summary>
    public Household? Household { get; set; }

    /// <summary>Creates a custom category for a household.</summary>
    /// <param name="name">The display name.</param>
    /// <param name="icon">The Lucide icon name.</param>
    /// <param name="color">The hex color.</param>
    /// <param name="kind">Whether the category groups expenses or income.</param>
    /// <param name="household">The owning household.</param>
    /// <returns>The new category.</returns>
    public static Category Create(string name, string icon, string color, CategoryKind kind, Household household) =>
        new()
        {
            Name = name,
            Icon = icon,
            Color = color,
            Kind = kind,
            CreatorType = CreatorType.User,
            Household = household
        };

    /// <summary>Updates the editable properties of the category.</summary>
    /// <param name="name">The display name.</param>
    /// <param name="icon">The Lucide icon name.</param>
    /// <param name="color">The hex color.</param>
    /// <param name="kind">Whether the category groups expenses or income.</param>
    public void Update(string name, string icon, string color, CategoryKind kind)
    {
        Name = name;
        Icon = icon;
        Color = color;
        Kind = kind;
    }
}
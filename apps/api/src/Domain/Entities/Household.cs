namespace Kijk.Domain.Entities;

/// <summary>A household: the unit that owns consumptions, limits and resources and that users are members of.</summary>
public sealed class Household : BaseEntity
{
    /// <summary>Gets or sets the household name.</summary>
    public required string Name { get; set; }
    /// <summary>Gets or sets an optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Gets the memberships of this household.</summary>
    public ICollection<UserHousehold> UserHouseholds { get; init; } = new List<UserHousehold>();
    /// <summary>Gets the consumptions recorded for this household.</summary>
    public ICollection<Consumption> Consumptions { get; init; } = new List<Consumption>();
    /// <summary>Gets the consumption limits of this household.</summary>
    public ICollection<ConsumptionLimit> ConsumptionLimits { get; init; } = new List<ConsumptionLimit>();
    /// <summary>Gets the custom resources owned by this household.</summary>
    public ICollection<Resource> Resources { get; init; } = new List<Resource>();
    /// <summary>Gets the units shared with this household.</summary>
    public ICollection<UnitHousehold> UnitHouseholds { get; init; } = new List<UnitHousehold>();

    /// <summary>Creates a household.</summary>
    /// <param name="name">The household name.</param>
    /// <param name="description">An optional description.</param>
    /// <returns>The new household.</returns>
    public static Household Create(string name, string? description = null) =>
        new()
        {
            Name = name,
            Description = description,
        };

    /// <summary>Renames the household.</summary>
    /// <param name="name">The new name.</param>
    public void Rename(string name) => Name = name;

    /// <summary>
    /// Updates the editable household details.
    /// </summary>
    /// <param name="name">The new household name.</param>
    /// <param name="description">The new household description, if provided.</param>
    public void UpdateDetails(string name, string? description)
    {
        Name = name;
        Description = description;
    }
}
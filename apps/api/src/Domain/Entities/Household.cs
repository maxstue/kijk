namespace Kijk.Domain.Entities;

public sealed class Household : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }

    public ICollection<UserHousehold> UserHouseholds { get; init; } = new List<UserHousehold>();
    public ICollection<Consumption> Consumptions { get; init; } = new List<Consumption>();
    public ICollection<ConsumptionLimit> ConsumptionLimits { get; init; } = new List<ConsumptionLimit>();
    public ICollection<Resource> Resources { get; init; } = new List<Resource>();
    public ICollection<UnitHousehold> UnitHouseholds { get; init; } = new List<UnitHousehold>();

    public static Household Create(string name, string? description = null) =>
        new()
        {
            Name = name,
            Description = description,
        };

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
namespace Kijk.Domain.Entities;

public sealed class Household : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; init; }

    public ICollection<UserHousehold> UserHouseholds { get; init; } = new List<UserHousehold>();
    public ICollection<Consumption> Consumptions { get; init; } = new List<Consumption>();
    public ICollection<ConsumptionLimit> ConsumptionLimits { get; init; } = new List<ConsumptionLimit>();
    public ICollection<Resource> Resources { get; init; } = new List<Resource>();

    public static Household Create(string name, string? description = null) =>
        new()
        {
            Name = name,
            Description = description,
        };

    public void Rename(string name) => Name = name;
}
namespace Kijk.Domain.Entities;

public sealed class Household : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }

    public List<UserHousehold> UserHouseholds { get; set; } = [];
    public List<Consumption> Consumptions { get; set; } = [];
    public List<ConsumptionLimit> ConsumptionLimits { get; set; } = [];

    public static Household Create(string name, string? description = null) =>
        new()
        {
            Id = Guid.CreateVersion7(),
            Name = name,
            Description = description,
        };
}
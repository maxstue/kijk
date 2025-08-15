namespace Kijk.Domain.Entities;

public sealed class Household : BaseEntity
{
    public required string Name { get; init; }
    public string? Description { get; init; }

    public IEnumerable<UserHousehold> UserHouseholds { get; init; } = [];
    public IEnumerable<Consumption> Consumptions { get; init; } = [];
    public IEnumerable<ConsumptionLimit> ConsumptionLimits { get; init; } = [];

    public static Household Create(string name, string? description = null) =>
        new()
        {
            Id = Guid.CreateVersion7(),
            Name = name,
            Description = description,
        };
}
namespace Kijk.Api.Domain.Entities;

public sealed class Household : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }

    /// <summary>
    ///     A boolean which represents if the household is active or not.
    /// </summary>
    public bool IsActive { get; set; }

    public List<UserHousehold> UserHouseholds { get; set; } = [];
    public List<EnergyConsumption> EnergyConsumptions { get; set; } = [];
    public List<EnergyConsumptionLimit> EnergyConsumptionLimits { get; set; } = [];

    public static Household Create(string name, bool isActive, string? description = default) =>
        new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            IsActive = isActive
        };
}

using Kijk.Api.Common.Models;

namespace Kijk.Api.Domain.Entities;

public sealed class EnergyConsumption : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required decimal Value { get; set; }
    public required EnergyConsumptionType Type { get; set; }
    
    public Guid HouseholdId { get; set; }
    
    public static EnergyConsumption Create(
        string name,
        EnergyConsumptionType type,
        decimal value,
        Guid householdId,
        string? description = default)
    {
        return new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Type = type,
            Value = value,
            HouseholdId = householdId
        };
    }
}

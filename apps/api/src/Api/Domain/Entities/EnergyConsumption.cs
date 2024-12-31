using Kijk.Api.Common.Models;

namespace Kijk.Api.Domain.Entities;

public sealed class EnergyConsumption : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required decimal Value { get; set; }
    public required EnergyConsumptionType Type { get; set; }

    /// <summary>
    /// Represents the datetime of the energy consumption.
    /// </summary>
    public required DateTime Date { get; set; }

    public Guid HouseholdId { get; set; }

    public static EnergyConsumption Create(string name, EnergyConsumptionType type, decimal value, Guid householdId, DateTime date,
        string? description = null) =>
        new()
        {
            Name = name,
            Description = description,
            Type = type,
            Value = value,
            Date = date,
            HouseholdId = householdId
        };
}
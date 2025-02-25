using Kijk.Shared;

namespace Kijk.Domain.Entities;

public sealed class Energy : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required decimal Value { get; set; }
    public required EnergyType Type { get; set; }

    /// <summary>
    /// Represents the datetime of the energy consumption.
    /// </summary>
    public required DateTime Date { get; set; }

    public Guid HouseholdId { get; set; }

    public static Energy Create(string name, EnergyType type, decimal value, Guid householdId, DateTime date,
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
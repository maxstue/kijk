using Kijk.Api.Common.Models;

namespace Kijk.Api.Domain.Entities;

public sealed class EnergyLimit : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required decimal Limit { get; set; }
    public required decimal ActualValue { get; set; }
    public required bool Active { get; set; }
    public required EnergyType Type { get; set; }
    public required DateTime LastOccurrence { get; set; }

    public Guid CreatedById { get; set; }
    public required User CreatedBy { get; set; }

    public Guid HouseholdId { get; set; }

    public static EnergyLimit Create(
        string name,
        decimal limit,
        decimal actualValue,
        bool active,
        EnergyType type,
        DateTime lastOccurrence,
        User createdBy,
        Guid householdId,
        string? description = default) => new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Limit = limit,
            ActualValue = actualValue,
            Active = active,
            Type = type,
            LastOccurrence = lastOccurrence,
            CreatedBy = createdBy,
            HouseholdId = householdId
        };

}
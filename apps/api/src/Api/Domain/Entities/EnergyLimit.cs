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
}
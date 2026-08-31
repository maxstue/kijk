using Kijk.Domain.ValueObjects;
using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// Represents a limit that should not be exceeded per household for a specific resource and period.
/// </summary>
public sealed class ConsumptionLimit : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }

    /// <summary>
    /// The limit that should not be exceeded.
    /// </summary>
    public required decimal Limit { get; set; }

    /// <summary>
    /// The period of the limit.
    /// </summary>
    public required Period Period { get; set; }

    /// <summary>
    /// The actual value of the resource usage.
    /// </summary>
    public required decimal ActualValue { get; set; }

    /// <summary>
    /// Indicates if the limit is active.
    /// </summary>
    public required bool Active { get; set; }

    public Guid ResourceId { get; set; }
    /// <summary>
    /// The resource that the limit is for.
    /// </summary>
    public required Resource Resource { get; set; }

    /// <summary>
    /// Last time the limit was reached.
    /// </summary>
    public required MonthYear LastOccurrence { get; set; }

    public Guid CreatedById { get; set; }
    /// <summary>
    /// The user that created the limit.
    /// </summary>
    public required User CreatedBy { get; set; }

    public Guid HouseholdId { get; set; }
    /// <summary>
    /// The household that the limit is for.
    /// </summary>
    public required Household Household { get; set; }

    /// <summary>
    /// Creates a consumption limit for a household resource.
    /// </summary>
    public static ConsumptionLimit Create(
        string name,
        string? description,
        decimal limit,
        Period period,
        bool active,
        Resource resource,
        User createdBy,
        Household household,
        DateTime currentDate) =>
        new()
        {
            Name = name,
            Description = description,
            Limit = limit,
            Period = period,
            ActualValue = 0,
            Active = active,
            Resource = resource,
            CreatedBy = createdBy,
            Household = household,
            LastOccurrence = MonthYear.ParseDateTime(currentDate)
        };

    /// <summary>
    /// Updates the editable properties of the consumption limit.
    /// </summary>
    public void Update(string name, string? description, decimal limit, Period period, bool active)
    {
        Name = name;
        Description = description;
        Limit = limit;
        Period = period;
        Active = active;
    }
}
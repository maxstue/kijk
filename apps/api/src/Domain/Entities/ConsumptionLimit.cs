using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// Represents a limit that should not be exceeded per household for a specific resource and period.
/// </summary>
public sealed class ConsumptionLimit : BaseEntity
{
    /// <summary>Gets or sets the display name of the limit.</summary>
    public required string Name { get; set; }
    /// <summary>Gets or sets an optional description.</summary>
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
    /// Indicates if the limit is active.
    /// </summary>
    public required bool Active { get; set; }

    /// <summary>
    /// UTC timestamp of the last recorded transition to a reached active limit.
    /// Null when no occurrence has been recorded.
    /// </summary>
    public DateTime? LastOccurrence { get; private set; }

    /// <summary>
    /// Records a new occurrence without overwriting the date while the limit remains reached.
    /// </summary>
    public void RecordOccurrence(bool wasReached, bool isReached, DateTime utcNow)
    {
        if (Active && !wasReached && isReached)
        {
            LastOccurrence = utcNow;
        }
    }

    /// <summary>Gets or sets the id of <see cref="Resource" />.</summary>
    public Guid ResourceId { get; set; }
    /// <summary>
    /// The resource that the limit is for.
    /// </summary>
    public required Resource Resource { get; set; }

    /// <summary>Gets or sets the id of <see cref="CreatedBy" />.</summary>
    public Guid CreatedById { get; set; }
    /// <summary>
    /// The user that created the limit.
    /// </summary>
    public required User CreatedBy { get; set; }

    /// <summary>Gets or sets the id of <see cref="Household" />.</summary>
    public Guid HouseholdId { get; set; }
    /// <summary>
    /// The household that the limit is for.
    /// </summary>
    public required Household Household { get; set; }

    /// <summary>
    /// Creates a consumption limit for a household resource.
    /// </summary>
    public static ConsumptionLimit Create(
        ConsumptionLimitSettings settings,
        Resource resource,
        User createdBy,
        Household household) =>
        new()
        {
            Name = settings.Name,
            Description = settings.Description,
            Limit = settings.Limit,
            Period = settings.Period,
            Active = settings.Active,
            Resource = resource,
            CreatedBy = createdBy,
            Household = household
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

/// <summary>
/// Defines the editable settings of a consumption limit.
/// </summary>
public sealed record ConsumptionLimitSettings(
    string Name,
    string? Description,
    decimal Limit,
    Period Period,
    bool Active);
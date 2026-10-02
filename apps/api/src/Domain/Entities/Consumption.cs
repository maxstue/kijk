using Kijk.Domain.ValueObjects;

namespace Kijk.Domain.Entities;

/// <summary>
/// Describes how a consumption value was entered.
/// </summary>
public enum ConsumptionValueType
{
    /// <summary>
    /// A cumulative meter reading.
    /// </summary>
    Absolute,

    /// <summary>
    /// Consumption since the previous reading.
    /// </summary>
    Relative
}

/// <summary>
/// Represents a consumption of a resource.
/// </summary>
public sealed class Consumption : BaseEntity
{
    /// <summary>Gets or sets the display name of the entry.</summary>
    public required string Name { get; set; }
    /// <summary>Gets or sets an optional description.</summary>
    public string? Description { get; set; }

    /// <summary>
    /// The value of the consumption.
    /// </summary>
    public required decimal Value { get; set; }

    /// <summary>
    /// Describes whether <see cref="Value"/> is a meter reading or a relative consumption value.
    /// </summary>
    public ConsumptionValueType ValueType { get; set; } = ConsumptionValueType.Relative;

    /// <summary>
    /// Indicates that this absolute reading starts a new meter calculation segment.
    /// </summary>
    public bool StartsNewMeterSegment { get; set; }

    /// <summary>
    /// The normalized consumption represented by this entry.
    /// </summary>
    public decimal CalculatedConsumption { get; set; }

    /// <summary>Gets or sets the id of <see cref="Resource" />.</summary>
    public Guid ResourceId { get; set; }
    /// <summary>
    /// The resource that was used.
    /// </summary>
    public required Resource Resource { get; set; }

    /// <summary>
    /// The UTC calendar day of the consumption.
    /// </summary>
    public required DateTime Date { get; set; }

    /// <summary>Gets or sets the id of <see cref="Household" />.</summary>
    public Guid HouseholdId { get; set; }
    /// <summary>
    /// The household that the consumption is for.
    /// </summary>
    public required Household Household { get; set; }

    /// <summary>Creates a consumption; the date is normalized to the UTC calendar day.</summary>
    /// <param name="name">The display name.</param>
    /// <param name="type">The consumed resource.</param>
    /// <param name="household">The owning household.</param>
    /// <param name="date">The consumption date.</param>
    /// <param name="reading">The entered value and how it is interpreted.</param>
    /// <param name="description">An optional description.</param>
    /// <returns>The new consumption.</returns>
    public static Consumption Create(
        string name,
        Resource type,
        Household household,
        DateTime date,
        ConsumptionReading reading,
        string? description = null) =>
        new()
        {
            Name = name,
            Description = description,
            Resource = type,
            Value = reading.Value,
            ValueType = reading.ValueType,
            StartsNewMeterSegment = reading.StartsNewMeterSegment,
            CalculatedConsumption = reading.CalculatedConsumption,
            Date = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc),
            Household = household
        };
}
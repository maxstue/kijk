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
    public required string Name { get; set; }
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
    /// The normalized consumption represented by this entry.
    /// </summary>
    public decimal CalculatedConsumption { get; set; }

    public Guid ResourceId { get; set; }
    /// <summary>
    /// The resource that was used.
    /// </summary>
    public required Resource Resource { get; set; }

    /// <summary>
    /// The UTC calendar day of the consumption.
    /// </summary>
    public required DateTime Date { get; set; }

    public Guid HouseholdId { get; set; }
    /// <summary>
    /// The household that the consumption is for.
    /// </summary>
    public required Household Household { get; set; }

    public static Consumption Create(
        string name,
        Resource type,
        decimal value,
        Household household,
        DateTime date,
        ConsumptionValueType valueType,
        decimal calculatedConsumption,
        string? description = null) =>
        new()
        {
            Name = name,
            Description = description,
            Resource = type,
            Value = value,
            ValueType = valueType,
            CalculatedConsumption = calculatedConsumption,
            Date = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc),
            Household = household
        };
}
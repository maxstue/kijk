using Kijk.Domain.ValueObjects;

namespace Kijk.Domain.Entities;

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

    public Guid ResourceId { get; set; }
    /// <summary>
    /// The resource that was used.
    /// </summary>
    public required Resource Resource { get; set; }

    /// <summary>
    /// The month and year of the consumption.
    /// </summary>
    public required MonthYear Date { get; set; }

    public Guid HouseholdId { get; set; }
    /// <summary>
    /// The household that the consumption is for.
    /// </summary>
    public required Household Household { get; set; }

    public static Consumption Create(string name, Resource type, decimal value, Household household, DateTime date,
        string? description = null) =>
        new()
        {
            Name = name,
            Description = description,
            Resource = type,
            Value = value,
            Date = MonthYear.ParseDateTime(date),
            Household = household
        };
}
namespace Kijk.Domain.Entities;

/// <summary>
/// Represents a record of the usage of a resource.
/// </summary>
public sealed class Consumption : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }

    /// <summary>
    /// The value of the resource usage.
    /// </summary>
    public required decimal Value { get; set; }

    public Guid ResourceId { get; set; }
    /// <summary>
    /// The resource that was used.
    /// </summary>
    public required Resource Resource { get; set; }

    /// <summary>
    /// Represents the date of the resource usage.
    /// </summary>
    public required DateTime Date { get; set; }

    public Guid HouseholdId { get; set; }
    /// <summary>
    /// The household that the usage record is for.
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
            Date = date,
            Household = household
        };
}
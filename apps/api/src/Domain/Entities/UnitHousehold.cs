namespace Kijk.Domain.Entities;

/// <summary>
/// Makes a user-created unit available to all members of a household.
/// </summary>
public sealed class UnitHousehold
{
    public Guid UnitId { get; set; }
    public required Unit Unit { get; set; }
    public Guid HouseholdId { get; set; }
    public required Household Household { get; set; }
    public Guid SharedByUserId { get; set; }
    public required User SharedByUser { get; set; }
    public DateTime SharedAt { get; set; }
}
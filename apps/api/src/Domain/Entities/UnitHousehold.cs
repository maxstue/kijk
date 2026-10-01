namespace Kijk.Domain.Entities;

/// <summary>
/// Makes a user-created unit available to all members of a household.
/// </summary>
public sealed class UnitHousehold
{
    /// <summary>Gets or sets the id of <see cref="Unit" />.</summary>
    public Guid UnitId { get; set; }
    /// <summary>Gets or sets the shared unit.</summary>
    public required Unit Unit { get; set; }
    /// <summary>Gets or sets the id of <see cref="Household" />.</summary>
    public Guid HouseholdId { get; set; }
    /// <summary>Gets or sets the household the unit is shared with.</summary>
    public required Household Household { get; set; }
    /// <summary>Gets or sets the id of <see cref="SharedByUser" />.</summary>
    public Guid SharedByUserId { get; set; }
    /// <summary>Gets or sets the user who shared the unit.</summary>
    public required User SharedByUser { get; set; }
    /// <summary>Gets or sets when the unit was shared (UTC).</summary>
    public DateTime SharedAt { get; set; }
}
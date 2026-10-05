using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// Describes how a unit converts to other units of the same physical quantity.
/// </summary>
public enum UnitConversionType
{
    /// <summary>
    /// Conversion is provided by UnitsNet.
    /// </summary>
    UnitsNet,

    /// <summary>
    /// Conversion is based on a factor relative to another unit.
    /// </summary>
    Factor,

    /// <summary>
    /// The unit cannot be converted.
    /// </summary>
    None
}

/// <summary>
/// Represents a reusable unit of measurement.
/// </summary>
public sealed class Unit : BaseEntity
{
    /// <summary>Gets or sets the display name, e.g. "Kilowatt hour".</summary>
    public required string Name { get; set; }
    /// <summary>Gets or sets the symbol, e.g. "kWh".</summary>
    public required string Symbol { get; set; }
    /// <summary>Gets or sets whether the unit is a system unit or created by a user.</summary>
    public CreatorType CreatorType { get; set; }
    /// <summary>Gets or sets how the unit converts to other units.</summary>
    public UnitConversionType ConversionType { get; set; }
    /// <summary>Gets or sets the physical quantity, e.g. "Energy"; only units of the same quantity convert.</summary>
    public required string QuantityKey { get; set; }
    /// <summary>Gets or sets the UnitsNet unit name for <see cref="UnitConversionType.UnitsNet" /> units.</summary>
    public string? UnitsNetUnitName { get; set; }
    /// <summary>Gets or sets the id of <see cref="ReferenceUnit" />.</summary>
    public Guid? ReferenceUnitId { get; set; }
    /// <summary>Gets or sets the unit a <see cref="UnitConversionType.Factor" /> unit is relative to.</summary>
    public Unit? ReferenceUnit { get; set; }
    /// <summary>Gets or sets how many reference units one unit equals.</summary>
    public decimal? ConversionFactor { get; set; }
    /// <summary>Gets or sets the id of <see cref="OwnerUser" />.</summary>
    public Guid? OwnerUserId { get; set; }
    /// <summary>Gets or sets the user who owns a user-created unit.</summary>
    public User? OwnerUser { get; set; }
    /// <summary>Gets or sets when the unit was archived; archived units cannot be used for new resources.</summary>
    public DateTime? ArchivedAt { get; set; }
    /// <summary>Gets the spaces the unit is shared with.</summary>
    public ICollection<UnitSpace> Spaces { get; init; } = new List<UnitSpace>();
}
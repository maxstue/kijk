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
    public required string Name { get; set; }
    public required string Symbol { get; set; }
    public CreatorType CreatorType { get; set; }
    public UnitConversionType ConversionType { get; set; }
    public required string QuantityKey { get; set; }
    public string? UnitsNetUnitName { get; set; }
    public Guid? ReferenceUnitId { get; set; }
    public Unit? ReferenceUnit { get; set; }
    public decimal? ConversionFactor { get; set; }
    public Guid? OwnerUserId { get; set; }
    public User? OwnerUser { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public ICollection<UnitHousehold> Households { get; init; } = new List<UnitHousehold>();
}
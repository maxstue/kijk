namespace Kijk.Domain.Entities;

/// <summary>
/// Represents a unit of measurement from the system unit catalog.
/// </summary>
public sealed class Unit : BaseEntity
{
    /// <summary>Gets or sets the display name, e.g. "Kilowatt hour".</summary>
    public required string Name { get; set; }
    /// <summary>Gets or sets the symbol, e.g. "kWh".</summary>
    public required string Symbol { get; set; }
    /// <summary>Gets or sets the quantity, e.g. "Energy"; only units of the same quantity convert.</summary>
    public required string QuantityKey { get; set; }
    /// <summary>Gets or sets the UnitsNet unit name; <see langword="null" /> for units that cannot be converted.</summary>
    public string? UnitsNetUnitName { get; set; }
}
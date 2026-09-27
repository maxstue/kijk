using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.Shared;

/// <summary>
/// Converts values between compatible units.
/// </summary>
public interface IUnitConversionService
{
    /// <summary>
    /// Resolves metadata for a UnitsNet unit enum member.
    /// </summary>
    Result<UnitMetadata> Resolve(string unitName);

    /// <summary>
    /// Converts a value between compatible units.
    /// </summary>
    Result<decimal> Convert(decimal value, Unit source, Unit target);
}

/// <summary>
/// Resolved UnitsNet metadata.
/// </summary>
public sealed record UnitMetadata(string Name, string Symbol, string QuantityKey, string UnitsNetUnitName);
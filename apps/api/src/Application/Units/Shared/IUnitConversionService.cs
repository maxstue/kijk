using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.Shared;

/// <summary>
/// Converts values between compatible units.
/// </summary>
public interface IUnitConversionService
{
    /// <summary>
    /// Converts a value between units of the same quantity.
    /// </summary>
    Result<decimal> Convert(decimal value, Unit source, Unit target);
}
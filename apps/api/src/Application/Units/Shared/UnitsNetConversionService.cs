using System.Globalization;
using Kijk.Domain.Entities;
using Kijk.Shared;
using UnitsNet;

namespace Kijk.Application.Units.Shared;

/// <summary>
/// Converts system units using UnitsNet.
/// </summary>
public sealed class UnitsNetConversionService : IUnitConversionService
{
    /// <inheritdoc />
    public Result<decimal> Convert(decimal value, Unit source, Unit target)
    {
        if (!string.Equals(source.QuantityKey, target.QuantityKey, StringComparison.Ordinal))
        {
            return Error.Validation($"'{source.Name}' and '{target.Name}' represent different quantities and cannot be converted");
        }

        if (source.Id == target.Id)
        {
            return value;
        }

        if (source.UnitsNetUnitName is null || target.UnitsNetUnitName is null)
        {
            return Error.Validation($"'{source.Name}' cannot be converted to '{target.Name}'");
        }

        return ConvertByName(value, source.QuantityKey, source.UnitsNetUnitName, target.UnitsNetUnitName);
    }

    private static Result<decimal> ConvertByName(decimal value, string quantity, string source, string target)
    {
        try
        {
            var converted = UnitConverter.ConvertByName((double)value, quantity, source, target);
            return decimal.Parse(converted.ToString("R", CultureInfo.InvariantCulture), CultureInfo.InvariantCulture);
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
        {
            return Error.Validation(exception.Message);
        }
    }
}
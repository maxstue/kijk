using System.Globalization;
using Kijk.Domain.Entities;
using Kijk.Shared;
using UnitsNet;

namespace Kijk.Application.Units.Shared;

/// <summary>
/// Converts standard and factor-based units using UnitsNet.
/// </summary>
public sealed class UnitsNetConversionService : IUnitConversionService
{
    /// <inheritdoc />
    public Result<UnitMetadata> Resolve(string unitName)
    {
        foreach (var quantity in Quantity.Infos)
        {
            var unit = quantity.UnitInfos.FirstOrDefault(info => string.Equals(info.Name, unitName, StringComparison.Ordinal));
            if (unit is null)
            {
                continue;
            }

            var symbol = UnitsNetSetup.Default.UnitAbbreviations.GetDefaultAbbreviation(unit.Value);
            return new UnitMetadata(unit.Name, symbol, quantity.Name, unit.Name);
        }

        return Error.Validation($"Unknown unit '{unitName}'");
    }

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

        var sourceBase = ToUnitsNet(value, source);
        if (sourceBase.IsError)
        {
            return sourceBase.Error;
        }

        return FromUnitsNet(sourceBase.Value.Value, sourceBase.Value.UnitName, target);
    }

    private static Result<(decimal Value, string UnitName)> ToUnitsNet(decimal value, Unit unit)
    {
        if (unit.ConversionType == UnitConversionType.UnitsNet && unit.UnitsNetUnitName is not null)
        {
            return (value, unit.UnitsNetUnitName);
        }

        if (unit.ConversionType != UnitConversionType.Factor || unit.ReferenceUnitId is null || unit.ConversionFactor is null)
        {
            return Error.Validation($"Unit '{unit.Name}' is not convertible");
        }

        var reference = unit.ReferenceUnit;
        if (reference?.UnitsNetUnitName is null)
        {
            return Error.Validation($"Reference unit for '{unit.Name}' is not convertible");
        }

        return (value * unit.ConversionFactor.Value, reference.UnitsNetUnitName);
    }

    private static Result<decimal> FromUnitsNet(decimal value, string sourceUnitName, Unit target)
    {
        if (target.ConversionType == UnitConversionType.UnitsNet && target.UnitsNetUnitName is not null)
        {
            return ConvertByName(value, target.QuantityKey, sourceUnitName, target.UnitsNetUnitName);
        }

        if (target.ConversionType != UnitConversionType.Factor || target.ReferenceUnitId is null || target.ConversionFactor is null)
        {
            return Error.Validation($"Unit '{target.Name}' is not convertible");
        }

        var reference = target.ReferenceUnit;
        if (reference?.UnitsNetUnitName is null)
        {
            return Error.Validation($"Reference unit for '{target.Name}' is not convertible");
        }

        var referenceValue = ConvertByName(value, target.QuantityKey, sourceUnitName, reference.UnitsNetUnitName);
        return referenceValue.IsError ? referenceValue.Error : referenceValue.Value / target.ConversionFactor.Value;
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
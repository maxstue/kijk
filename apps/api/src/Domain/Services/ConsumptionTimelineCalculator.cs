using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Domain.Services;

/// <summary>
/// Calculates normalized consumption values within a resource's measurement timeline.
/// </summary>
public static class ConsumptionTimelineCalculator
{
    /// <summary>
    /// Recalculates every entry in chronological order.
    /// </summary>
    /// <param name="consumptions">The complete timeline for one household and resource.</param>
    /// <returns>A successful result, or a validation error for a decreasing absolute reading.</returns>
    public static Result<bool> Recalculate(IEnumerable<Consumption> consumptions)
    {
        decimal? meterReading = null;

        foreach (var consumption in consumptions
                     .OrderBy(item => item.Date)
                     .ThenBy(item => item.CreatedAt)
                     .ThenBy(item => item.Id))
        {
            var calculation = CalculateConsumption(consumption, meterReading);
            if (calculation.IsError)
            {
                return calculation.Error;
            }

            consumption.CalculatedConsumption = calculation.Value;
            meterReading = ApplyToMeterReading(meterReading, consumption);
        }

        return true;
    }

    /// <summary>
    /// Calculates a new entry and updates the next absolute reading affected by its insertion.
    /// Existing entries on the same day are treated as preceding the new entry.
    /// </summary>
    /// <param name="consumption">The entry being inserted.</param>
    /// <param name="existingConsumptions">Existing entries for the same household and resource.</param>
    /// <returns>The calculated entry, or a validation error for a decreasing absolute reading.</returns>
    public static Result<Consumption> CalculateInsertion(
        Consumption consumption,
        IEnumerable<Consumption> existingConsumptions)
    {
        var timeline = existingConsumptions
            .OrderBy(item => item.Date)
            .ThenBy(item => item.CreatedAt)
            .ThenBy(item => item.Id)
            .ToList();

        decimal? meterReading = null;
        var insertionIndex = timeline.FindLastIndex(item => item.Date <= consumption.Date) + 1;

        foreach (var item in timeline.Take(insertionIndex))
        {
            meterReading = ApplyToMeterReading(meterReading, item);
        }

        var calculation = CalculateConsumption(consumption, meterReading);
        if (calculation.IsError)
        {
            return calculation.Error;
        }

        consumption.CalculatedConsumption = calculation.Value;
        meterReading = ApplyToMeterReading(meterReading, consumption);

        foreach (var item in timeline.Skip(insertionIndex))
        {
            if (item.ValueType == ConsumptionValueType.Relative)
            {
                meterReading = ApplyToMeterReading(meterReading, item);
                continue;
            }

            var nextCalculation = CalculateConsumption(item, meterReading);
            if (nextCalculation.IsError)
            {
                return nextCalculation.Error;
            }

            item.CalculatedConsumption = nextCalculation.Value;
            break;
        }

        return consumption;
    }

    private static Result<decimal> CalculateConsumption(Consumption consumption, decimal? previousMeterReading)
    {
        if (consumption.ValueType == ConsumptionValueType.Relative)
        {
            return consumption.Value;
        }

        if (previousMeterReading is null)
        {
            return 0m;
        }

        var calculatedConsumption = consumption.Value - previousMeterReading.Value;
        return calculatedConsumption < 0
            ? Error.Validation(
                $"Absolute meter reading {consumption.Value} on {consumption.Date:yyyy-MM-dd} must not be lower than the previous calculated meter reading {previousMeterReading.Value}.")
            : calculatedConsumption;
    }

    private static decimal? ApplyToMeterReading(decimal? meterReading, Consumption consumption) =>
        consumption.ValueType switch
        {
            ConsumptionValueType.Absolute => consumption.Value,
            ConsumptionValueType.Relative when meterReading is not null => meterReading.Value + consumption.Value,
            ConsumptionValueType.Relative => null,
            _ => throw new ArgumentOutOfRangeException(nameof(consumption), consumption.ValueType, "Unsupported consumption value type")
        };
}
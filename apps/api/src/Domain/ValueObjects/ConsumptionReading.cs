using Kijk.Domain.Entities;

namespace Kijk.Domain.ValueObjects;

/// <summary>
/// The entered value of a consumption and how it is interpreted.
/// </summary>
/// <param name="Value">The entered value.</param>
/// <param name="ValueType">Whether <paramref name="Value" /> is a meter reading or a relative value.</param>
/// <param name="CalculatedConsumption">The normalized consumption of the entry.</param>
/// <param name="StartsNewMeterSegment">Whether a meter reading starts a new meter segment.</param>
public sealed record ConsumptionReading(
    decimal Value,
    ConsumptionValueType ValueType,
    decimal CalculatedConsumption,
    bool StartsNewMeterSegment = false);
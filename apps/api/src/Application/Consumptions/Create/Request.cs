using NetEscapades.EnumGenerators;

namespace Kijk.Application.Consumptions.Create;

/// <summary>The data of a new consumption.</summary>
/// <param name="Name">The display name.</param>
/// <param name="Value">The entered value.</param>
/// <param name="ValueType">Whether <paramref name="Value" /> is a meter reading or the consumed amount.</param>
/// <param name="ResourceId">The consumed resource.</param>
/// <param name="Date">The consumption date.</param>
/// <param name="StartsNewMeterSegment">Whether a meter reading starts a new segment, e.g. after a meter replacement.</param>
public record CreateConsumptionRequest(
    string Name,
    decimal Value,
    CreateConsumptionValueTypes ValueType,
    Guid ResourceId,
    DateTime Date,
    bool StartsNewMeterSegment = false);

/// <summary>How the entered value of a consumption is interpreted.</summary>
[EnumExtensions]
public enum CreateConsumptionValueTypes
{
    /// <summary>A meter reading; the consumption is the difference to the previous reading.</summary>
    Absolute,

    /// <summary>The consumed amount itself.</summary>
    Relative
}
using NetEscapades.EnumGenerators;

namespace Kijk.Application.Consumptions.Update;

/// <summary>Changes to a consumption; <see langword="null" /> values keep the current value.</summary>
/// <param name="Name">The new display name.</param>
/// <param name="Value">The new value.</param>
/// <param name="ValueType">Whether the value is a meter reading or the consumed amount.</param>
/// <param name="ResourceId">The new resource.</param>
/// <param name="Date">The new date.</param>
/// <param name="StartsNewMeterSegment">Whether a meter reading starts a new segment.</param>
public record UpdateConsumptionRequest(
    string? Name,
    decimal? Value,
    UpdateConsumptionValueTypes ValueType,
    Guid? ResourceId,
    DateTime? Date,
    bool StartsNewMeterSegment = false);

/// <summary>How the entered value of a consumption is interpreted.</summary>
[EnumExtensions]
public enum UpdateConsumptionValueTypes
{
    /// <summary>A meter reading; the consumption is the difference to the previous reading.</summary>
    Absolute,

    /// <summary>The consumed amount itself.</summary>
    Relative
}
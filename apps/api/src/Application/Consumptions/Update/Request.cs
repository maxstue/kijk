using NetEscapades.EnumGenerators;

namespace Kijk.Application.Consumptions.Update;

public record UpdateConsumptionRequest(
    string? Name,
    decimal? Value,
    UpdateConsumptionValueTypes ValueType,
    Guid? ResourceId,
    DateTime? Date,
    bool StartsNewMeterSegment = false);

[EnumExtensions]
public enum UpdateConsumptionValueTypes { Absolute, Relative };
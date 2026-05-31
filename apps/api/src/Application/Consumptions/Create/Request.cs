using NetEscapades.EnumGenerators;

namespace Kijk.Application.Consumptions.Create;

public record CreateConsumptionRequest(string Name, decimal Value, CreateConsumptionValueTypes ValueType, Guid ResourceId, DateTime Date);

[EnumExtensions]
public enum CreateConsumptionValueTypes { Absolute, Relative };
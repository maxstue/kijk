using Kijk.Domain.Entities;

namespace Kijk.Application.Consumptions.Shared;

public record ConsumptionResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Value,
    ConsumptionValueType ValueType,
    decimal CalculatedConsumption,
    ConsumptionResourceResponse Resource,
    DateTime Date);

public record ConsumptionResourceResponse(Guid Id, string Name, string Unit, string Color);
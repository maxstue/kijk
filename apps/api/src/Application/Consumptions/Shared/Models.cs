namespace Kijk.Application.Consumptions.Shared;

public record ConsumptionResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Value,
    ConsumptionResourceResponse Resource,
    DateTime Date);

public record ConsumptionResourceResponse(Guid Id, string Name, string Unit, string Color);
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
    DateTime Date)
{
    /// <summary>
    /// The effective cumulative meter reading after applying this entry, when an absolute baseline exists.
    /// </summary>
    public decimal? CalculatedMeterReading { get; init; }
}

public record ConsumptionResourceResponse(Guid Id, string Name, string Unit, string Color, string Icon);
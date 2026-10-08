using Kijk.Domain.Entities;

namespace Kijk.Application.Consumptions.Shared;

/// <summary>A consumption entry.</summary>
/// <param name="Id">The consumption id.</param>
/// <param name="Name">The display name.</param>
/// <param name="Description">An optional description.</param>
/// <param name="Value">The entered value.</param>
/// <param name="ValueType">Whether <paramref name="Value" /> is a meter reading or a relative value.</param>
/// <param name="StartsNewMeterSegment">Whether the reading starts a new meter segment.</param>
/// <param name="CalculatedConsumption">The normalized consumption of this entry.</param>
/// <param name="Resource">The consumed resource.</param>
/// <param name="Date">The UTC calendar day.</param>
public record ConsumptionResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Value,
    ConsumptionValueType ValueType,
    bool StartsNewMeterSegment,
    decimal CalculatedConsumption,
    ConsumptionResourceResponse Resource,
    DateTime Date)
{
    /// <summary>
    /// The effective cumulative meter reading after applying this entry, when an absolute baseline exists.
    /// </summary>
    public decimal? CalculatedMeterReading { get; init; }
}

/// <summary>The resource of a consumption entry.</summary>
/// <param name="Id">The resource id.</param>
/// <param name="Name">The resource name.</param>
/// <param name="Unit">The unit symbol.</param>
/// <param name="Color">The display color.</param>
/// <param name="Icon">The icon name.</param>
public record ConsumptionResourceResponse(Guid Id, string Name, string Unit, string Color, string Icon);
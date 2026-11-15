namespace Kijk.Application.Units.Shared;

/// <summary>
/// A unit of the system unit catalog.
/// </summary>
/// <param name="Id">The unit id.</param>
/// <param name="Name">The display name, e.g. "Kilowatt hour".</param>
/// <param name="Symbol">The symbol, e.g. "kWh".</param>
/// <param name="QuantityKey">The quantity, e.g. "Energy"; a resource can only switch to a unit of the same quantity.</param>
public sealed record UnitResponse(Guid Id, string Name, string Symbol, string QuantityKey);
namespace Kijk.Application.Units.Create;

/// <summary>
/// Creates a reusable user unit.
/// </summary>
public sealed record CreateUnitRequest(
    string Name,
    string Symbol,
    Guid ReferenceUnitId,
    decimal ConversionFactor,
    IReadOnlyList<Guid>? ShareWithSpaceIds);
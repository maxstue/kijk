namespace Kijk.Application.Units.Update;

/// <summary>
/// Updates user-editable unit metadata.
/// </summary>
public sealed record UpdateUnitRequest(string Name, string Symbol, Guid ReferenceUnitId, decimal ConversionFactor);
namespace Kijk.Application.Resources.Update;

/// <summary>
/// Request to update one or more properties of a custom resource.
/// </summary>
/// <param name="Name">The optional resource name.</param>
/// <param name="Color">The optional six-digit hex color.</param>
/// <param name="Icon">The optional Lucide icon name.</param>
/// <param name="UnitId">The optional unit identifier.</param>
public record UpdateResourceRequest(string? Name, string? Color, string? Icon, Guid? UnitId);
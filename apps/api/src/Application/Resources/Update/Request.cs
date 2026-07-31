namespace Kijk.Application.Resources.Update;

/// <summary>
/// Request to update one or more properties of a custom resource.
/// </summary>
/// <param name="Name">The optional resource name.</param>
/// <param name="Color">The optional six-digit hex color.</param>
/// <param name="Unit">The optional unit of measurement.</param>
public record UpdateResourceRequest(string? Name, string? Color, string? Unit);
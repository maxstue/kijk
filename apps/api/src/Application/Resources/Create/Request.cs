namespace Kijk.Application.Resources.Create;

/// <summary>
/// Command to create a new resource type.
/// </summary>
/// <param name="Name"></param>
/// <param name="Color"></param>
/// <param name="Unit"></param>
public record CreateResourceRequest(string Name, string Color, string Unit);
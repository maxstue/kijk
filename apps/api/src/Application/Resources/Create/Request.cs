namespace Kijk.Application.Resources.Create;

/// <summary>
/// Command to create a new resource type.
/// </summary>
/// <param name="Name">The resource name.</param>
/// <param name="Color">The display color.</param>
/// <param name="Icon">The icon name.</param>
/// <param name="UnitId">The unit id.</param>
public record CreateResourceRequest(string Name, string Color, string Icon, Guid UnitId);
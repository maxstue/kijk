namespace Kijk.Application.Spaces.Update;

/// <summary>
/// Contains the editable details for a space.
/// </summary>
/// <param name="Name">The space name.</param>
/// <param name="Description">An optional space description.</param>
public sealed record UpdateSpaceRequest(string Name, string? Description);
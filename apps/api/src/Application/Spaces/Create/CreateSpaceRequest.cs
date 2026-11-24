namespace Kijk.Application.Spaces.Create;

/// <summary>
/// Contains the details of a new shared space.
/// </summary>
/// <param name="Name">The space name.</param>
/// <param name="Description">An optional space description.</param>
public sealed record CreateSpaceRequest(string Name, string? Description);

/// <summary>
/// The space that was created. The creator is its admin.
/// </summary>
/// <param name="Id">The identifier of the new space.</param>
public sealed record CreateSpaceResponse(Guid Id);
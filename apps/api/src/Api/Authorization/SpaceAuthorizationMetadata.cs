namespace Kijk.Api.Authorization;

/// <summary>
/// Marks an endpoint whose handler checks the permission against the space identified by the route,
/// instead of the user's active space.
/// </summary>
/// <param name="Permission">The permission the handler requires.</param>
public sealed record RouteSpacePermissionMetadata(string Permission);

/// <summary>
/// Marks an endpoint that intentionally requires no space permission, for example because its handler only
/// returns or changes data owned by the current user.
/// </summary>
/// <param name="Reason">Why no space permission is required.</param>
public sealed record NoSpacePermissionMetadata(string Reason);
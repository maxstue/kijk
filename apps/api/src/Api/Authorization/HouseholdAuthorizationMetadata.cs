namespace Kijk.Api.Authorization;

/// <summary>
/// Marks an endpoint whose handler checks the permission against the household identified by the route,
/// instead of the user's active household.
/// </summary>
/// <param name="Permission">The permission the handler requires.</param>
public sealed record RouteHouseholdPermissionMetadata(string Permission);

/// <summary>
/// Marks an endpoint that intentionally requires no household permission, for example because its handler only
/// returns or changes data owned by the current user.
/// </summary>
/// <param name="Reason">Why no household permission is required.</param>
public sealed record NoHouseholdPermissionMetadata(string Reason);
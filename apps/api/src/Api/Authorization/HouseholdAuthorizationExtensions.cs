using Kijk.Shared;

namespace Kijk.Api.Authorization;

/// <summary>
/// Declares the household authorization of endpoints. Every authenticated endpoint must use one of these methods.
/// </summary>
public static class HouseholdAuthorizationExtensions
{
    /// <summary>
    /// Requires the user's role to grant the permission in the active household.
    /// </summary>
    /// <param name="builder">The endpoint builder.</param>
    /// <param name="permission">The permission name.</param>
    /// <typeparam name="TBuilder">The endpoint builder type.</typeparam>
    /// <returns>The endpoint builder.</returns>
    public static TBuilder RequireHouseholdPermission<TBuilder>(this TBuilder builder, string permission)
        where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(AppConstants.Policies.HouseholdPermission(permission));

    /// <summary>
    /// Declares that the handler checks the permission against the household identified by the route.
    /// </summary>
    /// <param name="builder">The endpoint builder.</param>
    /// <param name="permission">The permission name.</param>
    /// <typeparam name="TBuilder">The endpoint builder type.</typeparam>
    /// <returns>The endpoint builder.</returns>
    public static TBuilder RequireRouteHouseholdPermission<TBuilder>(this TBuilder builder, string permission)
        where TBuilder : IEndpointConventionBuilder =>
        builder.WithMetadata(new RouteHouseholdPermissionMetadata(permission));

    /// <summary>
    /// Declares that the endpoint intentionally requires no household permission.
    /// </summary>
    /// <param name="builder">The endpoint builder.</param>
    /// <param name="reason">Why no household permission is required.</param>
    /// <typeparam name="TBuilder">The endpoint builder type.</typeparam>
    /// <returns>The endpoint builder.</returns>
    public static TBuilder WithoutHouseholdPermission<TBuilder>(this TBuilder builder, string reason)
        where TBuilder : IEndpointConventionBuilder =>
        builder.WithMetadata(new NoHouseholdPermissionMetadata(reason));
}
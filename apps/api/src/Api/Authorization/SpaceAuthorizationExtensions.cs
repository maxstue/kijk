using Kijk.Shared;

namespace Kijk.Api.Authorization;

/// <summary>
/// Declares the space authorization of endpoints. Every authenticated endpoint must use one of these methods.
/// </summary>
public static class SpaceAuthorizationExtensions
{
    /// <summary>The route parameter that names the space of a space group.</summary>
    public const string SpaceRouteParameter = "spaceId";

    /// <summary>
    /// Maps a group below <c>/spaces/{spaceId}</c>. Its endpoints work on the space named in the route; users who are
    /// not a member get a not-found response.
    /// </summary>
    /// <param name="builder">The route builder.</param>
    /// <param name="prefix">The route prefix below the space, e.g. <c>accounts</c>.</param>
    /// <returns>The group builder.</returns>
    public static RouteGroupBuilder MapSpaceGroup(this IEndpointRouteBuilder builder, string prefix) =>
        builder.MapGroup($"/spaces/{{{SpaceRouteParameter}:guid}}/{prefix}")
            .WithMetadata(new SpaceScopedMetadata(SpaceRouteParameter))
            .ProducesProblem(StatusCodes.Status404NotFound);

    /// <summary>
    /// Requires the user's role to grant the permission in the space of the route; use it inside
    /// <see cref="MapSpaceGroup" />.
    /// </summary>
    /// <param name="builder">The endpoint builder.</param>
    /// <param name="permission">The permission name.</param>
    /// <typeparam name="TBuilder">The endpoint builder type.</typeparam>
    /// <returns>The endpoint builder.</returns>
    public static TBuilder RequireSpacePermission<TBuilder>(this TBuilder builder, string permission)
        where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(AppConstants.Policies.SpacePermission(permission));

    /// <summary>
    /// Declares that the handler checks the permission against the space identified by the route.
    /// </summary>
    /// <param name="builder">The endpoint builder.</param>
    /// <param name="permission">The permission name.</param>
    /// <typeparam name="TBuilder">The endpoint builder type.</typeparam>
    /// <returns>The endpoint builder.</returns>
    public static TBuilder RequireRouteSpacePermission<TBuilder>(this TBuilder builder, string permission)
        where TBuilder : IEndpointConventionBuilder =>
        builder.WithMetadata(new RouteSpacePermissionMetadata(permission));

    /// <summary>
    /// Declares that the endpoint intentionally requires no space permission.
    /// </summary>
    /// <param name="builder">The endpoint builder.</param>
    /// <param name="reason">Why no space permission is required.</param>
    /// <typeparam name="TBuilder">The endpoint builder type.</typeparam>
    /// <returns>The endpoint builder.</returns>
    public static TBuilder WithoutSpacePermission<TBuilder>(this TBuilder builder, string reason)
        where TBuilder : IEndpointConventionBuilder =>
        builder.WithMetadata(new NoSpacePermissionMetadata(reason));
}
using Kijk.Api.Filters;
using Kijk.Shared;

namespace Kijk.Api.Extensions;

/// <summary>
/// Extensions for configuring route handlers.
/// </summary>
public static class RouteExtensions
{
    /// <summary>
    /// Adds a validation filter to the endpoint.
    /// </summary>
    /// <param name="builder">The route handler to validate.</param>
    /// <typeparam name="TRequest">The request type.</typeparam>
    /// <returns>The validated route handler.</returns>
    public static RouteHandlerBuilder WithRequestValidation<TRequest>(this RouteHandlerBuilder builder) where TRequest : class => builder
        .AddEndpointFilter<ValidationFilter<TRequest>>()
        .ProducesValidationProblem();

    /// <summary>
    /// Makes the endpoints unavailable (not found) for users the feature flag switches off.
    /// </summary>
    /// <param name="builder">The endpoint or group to protect.</param>
    /// <param name="feature">The feature key, see <see cref="AppConstants.Features" />.</param>
    /// <typeparam name="TBuilder">The endpoint builder type.</typeparam>
    /// <returns>The protected builder.</returns>
    public static TBuilder RequireFeature<TBuilder>(this TBuilder builder, string feature) where TBuilder : IEndpointConventionBuilder => builder
        .AddEndpointFilter(new FeatureFilter(feature));
}
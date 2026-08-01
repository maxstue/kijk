using Kijk.Api.Filters;

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
        .Produces(StatusCodes.Status400BadRequest);
}

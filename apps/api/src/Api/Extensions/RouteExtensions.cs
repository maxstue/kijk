using Kijk.Api.Filters;

namespace Kijk.Api.Extensions;

public static class RouteExtensions
{
    // TODO add wolverine fluentvalidation middleware with problemdetails or validate in each handlers LoadAsync hook
    /// <summary>
    /// Adds a validation filter to the endpoint.
    /// </summary>
    /// <param name="builder"></param>
    /// <typeparam name="TRequest"></typeparam>
    /// <returns></returns>
    public static RouteHandlerBuilder WithRequestValidation<TRequest>(this RouteHandlerBuilder builder) where TRequest : class => builder
        .AddEndpointFilter<ValidationFilter<TRequest>>()
        .Produces(StatusCodes.Status400BadRequest);
}
using System.Net;
using Kijk.Api.Common.Filters;

namespace Kijk.Api.Common.Extensions;

public static class RouteExtensions
{
    /// <summary>
    ///     Adds a validation filter to the endpoint.
    /// </summary>
    /// <param name="builder"></param>
    /// <typeparam name="TRequest"></typeparam>
    /// <returns></returns>
    public static RouteHandlerBuilder WithRequestValidation<TRequest>(this RouteHandlerBuilder builder) where TRequest : class
    {
        return builder.AddEndpointFilter<ValidationFilter<TRequest>>()
            .Produces((int)HttpStatusCode.BadRequest);
    }
}

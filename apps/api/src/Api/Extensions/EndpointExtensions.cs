using System.Reflection;
using Kijk.Api.Models;
using Kijk.Shared;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Kijk.Api.Extensions;

public static class EndpointExtensions
{
    /// <summary>
    /// Adds all endpoints to the service collection.
    /// </summary>
    /// <param name="services"></param>
    /// <returns></returns>
    public static IServiceCollection AddEndpoints(this IServiceCollection services)
    {
        var serviceDescriptors = Assembly.GetExecutingAssembly()
            .DefinedTypes
            .Where(type => type is { IsAbstract: false, IsInterface: false } && type.IsAssignableTo(typeof(IEndpointGroup)))
            .Select(type => ServiceDescriptor.Transient(typeof(IEndpointGroup), type))
            .ToArray();

        services.TryAddEnumerable(serviceDescriptors);

        return services;
    }

    /// <summary>
    /// Maps all endpoints to the application.
    /// All endpoints are registered in the "/api" group and are protected by the "All" policy and use a per user rate limit.
    /// </summary>
    /// <param name="app"></param>
    /// <returns></returns>
    public static WebApplication MapEndpoints(this WebApplication app)
    {
        var apiGroup = app.MapGroup("/api")
            .RequireAuthorization(AppConstants.Policies.All)
            .RequirePerUserRateLimit();

        var endpoints = app.Services.GetRequiredService<IEnumerable<IEndpointGroup>>();
        foreach (var endpoint in endpoints)
        {
            endpoint.MapEndpoints(apiGroup);
        }

        return app;
    }
}
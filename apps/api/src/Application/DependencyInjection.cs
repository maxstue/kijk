using Kijk.Application.Units.Shared;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application;

/// <summary>Registers the application layer services.</summary>
public static class DependencyInjection
{
    /// <summary>Registers all feature modules, handlers and shared application services.</summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddModules()
            .AddHandlers()
            .AddScoped<IUnitConversionService, UnitsNetConversionService>()
            .AddSingleton(TimeProvider.System);

        return services;
    }

}
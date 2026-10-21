using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application;

/// <summary>Registers the application layer services.</summary>
public static class DependencyInjection
{
    /// <summary>Registers all feature modules, validators and shared application services.</summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddModules()
            .AddValidators()
            .AddSingleton(TimeProvider.System);

        return services;
    }

}
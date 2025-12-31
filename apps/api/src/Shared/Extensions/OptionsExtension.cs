using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Kijk.Shared.Extensions;

/// <summary>
/// Binds the given option class of type <see cref="IConfigOptions"/> to the configuration section.
/// </summary>
public static class OptionsExtensions
{
    /// <summary>
    /// Binds the given option class of type <see cref="IConfigOptions"/> to the configuration section.
    /// This method also registers a scoped service for the option class.
    /// This allows us to inject the option class directly, instead of IOptions, which is more convenient.
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    /// <param name="lifetime">The lifetime of the registered options service. Default is Scoped.</param>
    /// <typeparam name="TOptions"></typeparam>
    /// <returns></returns>
    public static IServiceCollection ConfigureOptions<TOptions>(this IServiceCollection services, IConfiguration configuration, ServiceLifetime lifetime = ServiceLifetime.Scoped)
        where TOptions : class, IConfigOptions
    {
        services.Configure<TOptions>(configuration.GetSection(TOptions.SectionName));
        if (lifetime == ServiceLifetime.Singleton)
        {
            services.AddSingleton<TOptions>(sp => sp.GetRequiredService<IOptionsMonitor<TOptions>>().CurrentValue);
        }
        else if (lifetime == ServiceLifetime.Transient)
        {
            services.AddTransient<TOptions>(sp => sp.GetRequiredService<IOptions<TOptions>>().Value);
        }
        else if (lifetime == ServiceLifetime.Scoped)
        {
            services.AddScoped<TOptions>(registeredServices => registeredServices.GetRequiredService<IOptionsSnapshot<TOptions>>().Value);
        }

        return services;
    }
}
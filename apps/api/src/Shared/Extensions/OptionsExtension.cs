using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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
    /// <typeparam name="TOptions"></typeparam>
    /// <returns></returns>
    public static IServiceCollection ConfigureOptions<TOptions>(this IServiceCollection services, IConfiguration configuration)
        where TOptions : class, IConfigOptions
    {
        services.Configure<TOptions>(configuration.GetSection(TOptions.SectionName));
        services.AddScoped<TOptions>(registeredServices => registeredServices.GetRequiredService<IOptionsSnapshot<TOptions>>().Value);
        return services;
    }

    public static TOptions? GetConfigurationSection<TOptions>(this IHostApplicationBuilder builder)
        where TOptions : class, IConfigOptions => builder.Configuration
        .GetSection(TOptions.SectionName)
        .Get<TOptions>();
}
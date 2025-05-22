using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Kijk.Shared.Extensions;

/// <summary>
/// Binds the given option class of type <see cref="IConfigOptions"/> to the configuration section.
/// </summary>
public static class OptionsExtensions
{
    public static IServiceCollection ConfigureOptions<TOptions>(this IServiceCollection services, IConfiguration configuration)
        where TOptions : class, IConfigOptions => services.Configure<TOptions>(configuration.GetSection(TOptions.SectionName));

    public static TOptions? GetConfigurationSection<TOptions>(this IHostApplicationBuilder builder)
        where TOptions : class, IConfigOptions => builder.Configuration
        .GetSection(TOptions.SectionName)
        .Get<TOptions>();
}
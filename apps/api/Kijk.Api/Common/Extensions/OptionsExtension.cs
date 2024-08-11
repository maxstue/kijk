using Kijk.Api.Common.Options;

namespace Kijk.Api.Common.Extensions;

/// <summary>
/// Binds the given option class of type <see cref="IConfigOptions"/> to the configuration section.
/// </summary>
public static class OptionsExtensions
{
    public static IServiceCollection ConfigureOptions<TOptions>(this IServiceCollection services, IConfiguration configuration)
        where TOptions : class, IConfigOptions
    {
        return services.Configure<TOptions>(configuration.GetSection(TOptions.SectionName));
    }

    public static TOptions? GetConfigurationSection<TOptions>(this IHostApplicationBuilder builder)
        where TOptions : class, IConfigOptions
    {
        return builder.Configuration
            .GetSection(TOptions.SectionName)
            .Get<TOptions>();
    }
}

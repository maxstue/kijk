using Kijk.Api.Common.Options;

namespace Kijk.Api.Common.Extensions;

/// <summary>
/// Binds the given option class of type <see cref="IConfigOptions"/> to the configuration section.
/// </summary>
public static class OptionsExtensions
{
    public static IHostApplicationBuilder Configure<TOptions>(this IHostApplicationBuilder builder) where TOptions : class, IConfigOptions
    {
        var section = builder.Configuration.GetSection(TOptions.SectionName);
        builder.Services.Configure<TOptions>(section);
        return builder;
    }

    public static TOptions? GetConfigurationSection<TOptions>(this IHostApplicationBuilder builder)
        where TOptions : class, IConfigOptions
    {
        return builder.Configuration
            .GetSection(TOptions.SectionName)
            .Get<TOptions>();
    }
}

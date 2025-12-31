using Serilog;

namespace Kijk.Api.Extensions;

public static class HostExtensions
{
    /// <summary>
    /// Adds logging integration to the WebApplicationBuilder.
    /// This includes Serilog.
    /// </summary>
    /// <param name="builder"></param>
    /// <returns></returns>
    public static WebApplicationBuilder AddLogging(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, services, configuration) =>
        {
            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .WriteTo.Sentry();
        });

        return builder;
    }
}
using Serilog;

namespace Kijk.Api.Extensions;

public static class HostExtensions
{
    public static WebApplicationBuilder AddErrorTracking(this WebApplicationBuilder builder)
    {
        builder.WebHost.UseSentry();
        return builder;
    }

    public static WebApplicationBuilder AddLogging(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, services, configuration) =>
        {
            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services);
            if (builder.Environment.IsProduction())
            {
                configuration.WriteTo.Sentry();
            }
        });

        return builder;
    }
}
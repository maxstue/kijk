namespace Kijk.Api.Common.Extensions;

public static class HostExtensions
{
    public static WebApplicationBuilder AddErrorTracking(this WebApplicationBuilder builder)
    {
        builder.WebHost.UseSentry();
        builder.Services.AddSentryTunneling();

        return builder;
    }

    public static WebApplicationBuilder AddLogging(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog(
            (context, services, configuration) =>
                configuration
                    .ReadFrom.Configuration(context.Configuration)
                    .ReadFrom.Services(services));

        return builder;
    }
}

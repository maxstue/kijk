using Serilog.Extensions.Hosting;

namespace Kijk.Api.Common.Utils;

public static class LoggerUtils
{
    public static ReloadableLogger CreateRootLogger()
    {
        return new LoggerConfiguration()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
            .Enrich.FromLogContext()
            .WriteTo.Console()
            .WriteTo.Sentry(
                opt =>
                {
                    opt.InitializeSdk = false;
                })
            .CreateBootstrapLogger();
    }
}

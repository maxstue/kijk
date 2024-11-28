using Serilog.Extensions.Hosting;
using Serilog.Sinks.SystemConsole.Themes;

namespace Kijk.Api.Common.Utils;

public static class LoggerUtils
{
    public static ReloadableLogger CreateRootLogger()
    {
        return new LoggerConfiguration()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
            .Enrich.FromLogContext()
            .WriteTo.Console(theme: AnsiConsoleTheme.Code)
            .CreateBootstrapLogger();
    }
}
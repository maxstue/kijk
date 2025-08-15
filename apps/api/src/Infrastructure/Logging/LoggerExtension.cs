using Serilog;
using Serilog.Events;
using Serilog.Extensions.Hosting;
using Serilog.Sinks.SystemConsole.Themes;

namespace Kijk.Infrastructure.Logging;

/// <summary>
/// Logger extension methods.
/// </summary>
public static class LoggerExtension
{
    /// <summary>
    /// Creates a reloadable logger.
    /// </summary>
    /// <param name="configuration"></param>
    /// <returns></returns>
    public static ReloadableLogger CreateReloadableLogger(this LoggerConfiguration configuration) => configuration
        .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
        .Enrich.FromLogContext()
        .WriteTo.Console(theme: AnsiConsoleTheme.Code)
        .CreateBootstrapLogger();
}
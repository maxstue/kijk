using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Serilog;

namespace Kijk.Infrastructure.Persistence.Interceptors;

/// <summary>
/// This interceptor logs slow queries.
/// </summary>
/// <param name="loggingEnabled">Whether slow queries are logged.</param>
/// <param name="queryThreshold">The duration in milliseconds above which a query is slow.</param>
public class SlowQueryInterceptor(bool loggingEnabled, int queryThreshold) : DbCommandInterceptor
{
    private readonly ILogger _logger = Log.ForContext<SlowQueryInterceptor>();

    /// <summary>Logs a warning when a query took longer than the configured threshold.</summary>
    /// <param name="command">The executed command.</param>
    /// <param name="eventData">The execution event data.</param>
    /// <param name="result">The data reader.</param>
    /// <returns>The unchanged data reader.</returns>
    public override DbDataReader ReaderExecuted(DbCommand command, CommandExecutedEventData eventData, DbDataReader result)
    {
        if (!loggingEnabled)
        {
            return base.ReaderExecuted(command, eventData, result);
        }

        var elapsedMilliseconds = eventData.Duration.TotalMilliseconds;

        if (elapsedMilliseconds > queryThreshold)
        {
            _logger.Warning("Slow query detected (>{Threshold} ms): {CommandText} took {ElapsedMilliseconds} ms",
                queryThreshold, command.CommandText, elapsedMilliseconds);
        }

        return base.ReaderExecuted(command, eventData, result);
    }
}
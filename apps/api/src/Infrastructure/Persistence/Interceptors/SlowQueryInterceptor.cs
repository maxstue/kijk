using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Serilog;

namespace Kijk.Infrastructure.Persistence.Interceptors;

/// <summary>
/// This interceptor logs slow queries.
/// </summary>
/// <param name="loggingEnabled"></param>
/// <param name="queryThreshold"></param>
public class SlowQueryInterceptor(bool loggingEnabled, int queryThreshold) : DbCommandInterceptor
{
    private readonly ILogger _logger = Log.ForContext<SlowQueryInterceptor>();

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
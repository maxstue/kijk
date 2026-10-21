namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Enriches the events reported to the error tracking service (Sentry). Unhandled exceptions are captured by the Sentry
/// middleware itself.
/// </summary>
public interface ITelemetryService
{
    /// <summary>Attaches the correlation id of the current request to reported events.</summary>
    /// <param name="correlationId">The correlation id.</param>
    void SetCorrelationId(string correlationId);
}
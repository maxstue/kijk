namespace Kijk.Infrastructure.Telemetry;

/// <inheritdoc cref="ITelemetryService"/>
public class TelemetryService(IHub client) : ITelemetryService
{
    /// <inheritdoc />
    public void SetCorrelationId(string correlationId) => client.ConfigureScope(s => s.SetTag("correlation_id", correlationId));
}
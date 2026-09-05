using Microsoft.AspNetCore.Mvc;

namespace Kijk.Infrastructure.Telemetry;

/// <inheritdoc cref="ITelemetryService"/>
public class TelemetryService(IHub client) : ITelemetryService
{
    public void SetCorrelationId(string correlationId) => client.ConfigureScope(s => s.SetTag("correlation_id", correlationId));

    ///  <inheritdoc cref="ITelemetryService.SendProblemDetails"/>
    public void SendProblemDetails(ProblemDetails problemDetails)
    {
        client.CaptureMessage("API problem", opt =>
        {
            opt.SetTag("http_status", problemDetails.Status?.ToString() ?? "unknown");
            opt.SetTag("error_code", problemDetails.Extensions.TryGetValue("errorCode", out var errorCode)
                ? errorCode?.ToString() ?? "unknown"
                : "unknown");
            opt.SetTag("error_type", problemDetails.Extensions.TryGetValue("errorType", out var errorType)
                ? errorType?.ToString() ?? "unknown"
                : "unknown");
        });
    }
}
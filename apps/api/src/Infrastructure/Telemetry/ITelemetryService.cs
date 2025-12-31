using Microsoft.AspNetCore.Mvc;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Interface for handling telemetry data, like errors and logs.
/// This is used to report errors to an external service like Sentry.
/// </summary>
public interface ITelemetryService
{
    void SetCorrelationId(string correlationId);
    void SetUser(string? userId, string? extAuthId);

    /// <summary>
    /// Sends the problem details to the error reporting service.
    /// </summary>
    /// <param name="problemDetails"></param>
    void SendProblemDetails(ProblemDetails problemDetails);
}
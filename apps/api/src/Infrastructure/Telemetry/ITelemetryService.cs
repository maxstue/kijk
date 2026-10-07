using Microsoft.AspNetCore.Mvc;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Interface for handling telemetry data, like errors and logs.
/// This is used to report errors to an external service like Sentry.
/// </summary>
public interface ITelemetryService
{
    /// <summary>Attaches the correlation id of the current request to reported events.</summary>
    /// <param name="correlationId">The correlation id.</param>
    void SetCorrelationId(string correlationId);

    /// <summary>
    /// Sends the problem details to the error reporting service.
    /// </summary>
    /// <param name="problemDetails">The problem details to report.</param>
    void SendProblemDetails(ProblemDetails problemDetails);
}
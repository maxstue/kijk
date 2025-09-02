using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Services;

/// <summary>
/// Interface for error reporting.
/// This is used to report errors to an external service like Sentry.
/// </summary>
public interface IErrorReportingService
{
    /// <summary>
    /// Sends the problem details to the error reporting service.
    /// </summary>
    /// <param name="problemDetails"></param>
    void SendProblemDetails(ProblemDetails problemDetails);
}
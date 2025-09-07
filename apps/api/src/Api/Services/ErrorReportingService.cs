using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Services;

/// <inheritdoc cref="IErrorReportingService"/>
public class ErrorReportingService(IHub client) : IErrorReportingService
{
    ///  <inheritdoc cref="IErrorReportingService.SendProblemDetails"/>
    public void SendProblemDetails(ProblemDetails problemDetails)
    {
        client.CaptureMessage(problemDetails.Detail ?? "No detail", opt =>
        {
            opt.SetExtra("Response", problemDetails);
            opt.SetExtra("Status", problemDetails.Status);
            opt.SetExtra("Title", problemDetails.Title);
            opt.SetExtra("Detail", problemDetails.Detail);
            opt.SetExtra("Type", problemDetails.Type);
            opt.SetExtra("Instance", problemDetails.Instance);
            opt.SetExtra("TraceId", problemDetails.Extensions["traceId"]);
            opt.SetExtra("ErrorType", problemDetails.Extensions["errorType"]);
            opt.SetExtra("Extensions", problemDetails.Extensions);
            if (problemDetails is ValidationProblemDetails validationProblemDetails)
            {
                opt.SetExtra("errors", validationProblemDetails.Errors);
            }
        });
    }
}
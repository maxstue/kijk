using Kijk.Infrastructure.Auth;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Infrastructure.Telemetry;

/// <inheritdoc cref="ITelemetryService"/>
public class TelemetryService(IHub client, TelemetryOptions options) : ITelemetryService
{
    public void SetCorrelationId(string correlationId) => client.ConfigureScope(s => s.SetTag("trace_Id", correlationId));

    public void SetUser(string? userId, string? extAuthId)
    {
        if (userId == null)
        {
            return;
        }

        var pseudoId = Anonymizer.PseudoId(userId, options.Salt);

        if (extAuthId == null)
        {
            client.ConfigureScope(s => s.User = new() { Id = pseudoId });
            return;
        }

        var dict = new Dictionary<string, string> { { "extAuthId", extAuthId } };
        client.ConfigureScope(s => s.User = new() { Id = pseudoId, Other = dict });
    }

    ///  <inheritdoc cref="ITelemetryService.SendProblemDetails"/>
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
            opt.SetExtra("CorrelationId", problemDetails.Extensions["correlationId"]);
            opt.SetExtra("ErrorType", problemDetails.Extensions["errorType"]);
            opt.SetExtra("Extensions", problemDetails.Extensions);
            if (problemDetails is ValidationProblemDetails validationProblemDetails)
            {
                opt.SetExtra("errors", validationProblemDetails.Errors);
            }
        });
    }
}
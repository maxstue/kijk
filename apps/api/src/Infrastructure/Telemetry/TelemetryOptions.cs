using Kijk.Shared;

namespace Kijk.Infrastructure.Telemetry;

public class TelemetryOptions : IConfigOptions
{
    public static string SectionName => "Telemetry";
    public required string Salt { get; set; }
}
using Kijk.Infrastructure.Ai;
using Kijk.Infrastructure.Auth;
using Kijk.Infrastructure.FeatureFlags;
using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Jobs;
using Kijk.Infrastructure.Persistence;
using Kijk.Infrastructure.Telemetry;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure.Configuration;

/// <summary>Validates all application options using the .NET options validation generator.</summary>
[OptionsValidator]
internal sealed partial class InfrastructureOptionsValidator :
    IValidateOptions<AuthOptions>,
    IValidateOptions<ConnectionOptions>,
    IValidateOptions<PersistenceOptions>,
    IValidateOptions<AiOptions>,
    IValidateOptions<FingerprintOptions>,
    IValidateOptions<KeyRingOptions>,
    IValidateOptions<JobsOptions>,
    IValidateOptions<TelemetryOptions>,
    IValidateOptions<FeatureFlagsOptions>
{
}
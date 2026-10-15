using System.Reflection;
using Kijk.Infrastructure.Ai;
using Kijk.Infrastructure.Auth;
using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Jobs;
using Kijk.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure.Configuration;

/// <summary>Registers all application options with generated binding and validation.</summary>
internal static class ConfigurationDependencyInjection
{
    internal static bool IsGeneratingOpenApiDocument => Assembly.GetEntryAssembly()?.GetName().Name == "GetDocument.Insider";

    internal static IServiceCollection AddConfigurationOptions(this IServiceCollection services, IConfiguration configuration)
    {
        // Keep concrete binding calls so the .NET generator can intercept every options type.
        var auth = services.AddOptions<AuthOptions>().Bind(configuration.GetSection(AuthOptions.SectionName));
        var connection = services.AddOptions<ConnectionOptions>().Bind(configuration.GetSection(ConnectionOptions.SectionName));
        var persistence = services.AddOptions<PersistenceOptions>().Bind(configuration.GetSection(PersistenceOptions.SectionName));
        var ai = services.AddOptions<AiOptions>().Bind(configuration.GetSection(AiOptions.SectionName));
        var fingerprint = services.AddOptions<FingerprintOptions>().Bind(configuration.GetSection(FingerprintOptions.SectionName));
        var keyRing = services.AddOptions<KeyRingOptions>().Bind(configuration.GetSection(KeyRingOptions.SectionName));
        var jobs = services.AddOptions<JobsOptions>().Bind(configuration.GetSection(JobsOptions.SectionName));

        services.AddSingleton<IValidateOptions<AuthOptions>, InfrastructureOptionsValidator>();
        services.AddSingleton<IValidateOptions<ConnectionOptions>, InfrastructureOptionsValidator>();
        services.AddSingleton<IValidateOptions<PersistenceOptions>, InfrastructureOptionsValidator>();
        services.AddSingleton<IValidateOptions<AiOptions>, InfrastructureOptionsValidator>();
        services.AddSingleton<IValidateOptions<FingerprintOptions>, InfrastructureOptionsValidator>();
        services.AddSingleton<IValidateOptions<KeyRingOptions>, InfrastructureOptionsValidator>();
        services.AddSingleton<IValidateOptions<JobsOptions>, InfrastructureOptionsValidator>();

        if (!IsGeneratingOpenApiDocument)
        {
            auth.ValidateOnStart();
            connection.ValidateOnStart();
            persistence.ValidateOnStart();
            ai.ValidateOnStart();
            fingerprint.ValidateOnStart();
            keyRing.ValidateOnStart();
            jobs.ValidateOnStart();
        }

        return services;
    }
}
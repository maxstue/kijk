using System.Reflection;
using JasperFx.CodeGeneration.Model;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Security;
using Kijk.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Npgsql;
using Wolverine;
using Wolverine.EntityFrameworkCore;
using Wolverine.ErrorHandling;
using Wolverine.Postgresql;

namespace Kijk.Infrastructure.Imports;

/// <summary>Registers the import infrastructure: keys, file encryption, background jobs and cleanup.</summary>
internal static class ImportsDependencyInjection
{
    private const string WolverineSchema = "wolverine";

    private static bool IsGeneratingOpenApiDocument => Assembly.GetEntryAssembly()?.GetName().Name == "GetDocument.Insider";

    /// <summary>Registers the import services.</summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The application configuration.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddImports(this IServiceCollection services, IConfiguration configuration)
    {
        var fingerprint = services.AddOptions<FingerprintOptions>()
            .Bind(configuration.GetSection(FingerprintOptions.SectionName))
            .Validate(options => SecretKey.IsValid(options.MasterKey), "Fingerprint__MasterKey must be 32 random bytes, Base64-encoded");
        var keyRing = services.AddOptions<KeyRingOptions>()
            .Bind(configuration.GetSection(KeyRingOptions.SectionName))
            .Validate(options => SecretKey.IsValid(options.KeyEncryptionKey), "DataProtection__KeyEncryptionKey must be 32 random bytes, Base64-encoded");
        // Fail at startup instead of at the first import, except while the build generates the OpenAPI document.
        if (!IsGeneratingOpenApiDocument)
        {
            fingerprint.ValidateOnStart();
            keyRing.ValidateOnStart();
        }

        services.AddSingleton<IPseudonymizer, HmacPseudonymizer>();
        services.AddSingleton<IImportFileProtector, ImportFileProtector>();

        services.AddDataProtection()
            .SetApplicationName("Kijk")
            .PersistKeysToDbContext<AppDbContext>();
        services.AddOptions<KeyManagementOptions>()
            .Configure<IOptions<KeyRingOptions>>((options, keyRing) => options.XmlEncryptor = new AesGcmXmlEncryptor(keyRing));

        var jobs = configuration.GetSection(JobsOptions.SectionName).Get<JobsOptions>() ?? new JobsOptions();
        if (IsGeneratingOpenApiDocument)
        {
            services.AddScoped<IImportJobQueue, DisabledImportJobQueue>();
            return services;
        }

        services.AddHostedService<ImportCleanupService>();
        if (!jobs.Enabled)
        {
            services.AddScoped<IImportJobQueue, DisabledImportJobQueue>();
            return services;
        }

        var connectionString = configuration.GetConnectionString("DefaultConnection")
                               ?? throw new InvalidOperationException("The connection string 'DefaultConnection' is missing");
        services.AddWolverine(options =>
        {
            options.ApplicationAssembly = typeof(ImportsDependencyInjection).Assembly;
            // Handler dependencies such as IAppDbContext are registered with factories, so Wolverine resolves them
            // from the message's service scope instead of constructing them inline.
            options.ServiceLocationPolicy = ServiceLocationPolicy.AlwaysAllowed;
            options.Discovery.DisableConventionalDiscovery().IncludeType(typeof(ImportMessageHandler));
            options.Durability.Mode = jobs.DurabilityMode;
            options.PersistMessagesWithPostgresql(connectionString, WolverineSchema);
            options.UseEntityFrameworkCoreTransactions();
            options.Policies.UseDurableLocalQueues();
            options.OnException<NpgsqlException>().RetryWithCooldown(
                TimeSpan.FromSeconds(1),
                TimeSpan.FromSeconds(10),
                TimeSpan.FromSeconds(60));
        });
        services.AddScoped<IImportJobQueue, WolverineImportJobQueue>();

        return services;
    }
}
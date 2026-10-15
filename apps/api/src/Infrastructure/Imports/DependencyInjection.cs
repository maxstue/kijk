using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Security;
using Kijk.Infrastructure.Configuration;
using Kijk.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure.Imports;

/// <summary>Registers import encryption, pseudonymization and cleanup.</summary>
internal static class ImportsDependencyInjection
{
    /// <summary>Registers the import services.</summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddImports(this IServiceCollection services)
    {
        services.AddSingleton<IPseudonymizer, HmacPseudonymizer>();
        services.AddSingleton<IImportFileProtector, ImportFileProtector>();

        var dataProtection = services.AddDataProtection().SetApplicationName("Kijk");
        if (ConfigurationDependencyInjection.IsGeneratingOpenApiDocument)
        {
            // Document generation must not open the database-backed key ring or require production secrets.
            dataProtection.UseEphemeralDataProtectionProvider();
            return services;
        }

        dataProtection.PersistKeysToDbContext<AppDbContext>();
        services.AddOptions<KeyManagementOptions>()
            .Configure<IOptions<KeyRingOptions>>((options, keyRing) => options.XmlEncryptor = new AesGcmXmlEncryptor(keyRing));
        services.AddHostedService<ImportCleanupService>();

        return services;
    }
}
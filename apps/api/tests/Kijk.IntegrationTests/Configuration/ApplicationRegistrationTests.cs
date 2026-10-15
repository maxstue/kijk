using Kijk.Application;
using Kijk.Application.Imports.Categorization;
using Kijk.Application.Imports.Detection;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Jobs;
using Kijk.Application.Units.Shared;
using Kijk.Application.Users.Delete;
using Kijk.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Sentry.Extensibility;

namespace Kijk.IntegrationTests.Configuration;

public class ApplicationRegistrationTests
{
    [Test]
    public async Task AllFeatureServicesResolveAndUseTheRequestScope()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
        builder.Configuration.Sources.Clear();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=kijk-registration-tests",
            ["Auth:Authority"] = "https://identity.example.test",
            ["Cors:0"] = "http://localhost",
            ["Fingerprint:MasterKey"] = Convert.ToBase64String(new byte[32]),
            ["DataProtection:KeyEncryptionKey"] = Convert.ToBase64String(new byte[32])
        });
        builder.Host.UseDefaultServiceProvider(options =>
        {
            options.ValidateOnBuild = true;
            options.ValidateScopes = true;
        });
        builder.Services.AddApplication().AddInfrastructure(builder.Configuration);
        builder.Services.AddScoped<IJobQueue, UnexpectedJobQueue>();
        builder.Services.AddScoped<IIdentityProvider, UnexpectedIdentityProvider>();
        builder.Services.AddSingleton<IHub>(HubAdapter.Instance);

        await using var application = builder.Build();
        using var firstScope = application.Services.CreateScope();
        using var secondScope = application.Services.CreateScope();

        // Discover handlers and processors independently of their registrations so omissions fail this test.
        var featureServices = typeof(IModule).Assembly.GetExportedTypes()
            .Where(static type => type is { IsClass: true, IsAbstract: false }
                && (type.Name.EndsWith("Handler", StringComparison.Ordinal)
                    || type.Name.EndsWith("Processor", StringComparison.Ordinal)))
            .Concat([typeof(ImportFileReader), typeof(AccountEraser), typeof(ICsvFormatDetector),
                typeof(ITransactionCategorizer), typeof(IUnitConversionService)]);

        foreach (var serviceType in featureServices)
        {
            var registration = builder.Services.Single(descriptor => descriptor.ServiceType == serviceType);
            await Assert.That(registration.Lifetime).IsEqualTo(ServiceLifetime.Scoped);

            var instance = firstScope.ServiceProvider.GetRequiredService(serviceType);
            await Assert.That(ReferenceEquals(instance, firstScope.ServiceProvider.GetRequiredService(serviceType))).IsTrue();
            await Assert.That(ReferenceEquals(instance, secondScope.ServiceProvider.GetRequiredService(serviceType))).IsFalse();
        }
    }

    private sealed class UnexpectedJobQueue : IJobQueue
    {
        public Task SaveChangesAndEnqueueAsync<TMessage>(TMessage message, CancellationToken cancellationToken)
            where TMessage : class =>
            throw new InvalidOperationException("Registration tests must not enqueue background work.");
    }

    private sealed class UnexpectedIdentityProvider : IIdentityProvider
    {
        public Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Registration tests must not call the identity provider.");

        public Task SetUseProfileInKijkAsync(string authId, bool useProfileInKijk, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Registration tests must not call the identity provider.");

        public Task DeleteAsync(string authId, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Registration tests must not call the identity provider.");
    }
}
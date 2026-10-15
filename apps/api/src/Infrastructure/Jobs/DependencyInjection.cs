using JasperFx.CodeGeneration.Model;
using Kijk.Application.Shared.Jobs;
using Kijk.Infrastructure.Configuration;
using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Users.Delete;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Npgsql;
using Wolverine;
using Wolverine.EntityFrameworkCore;
using Wolverine.ErrorHandling;
using Wolverine.Postgresql;

namespace Kijk.Infrastructure.Jobs;

/// <summary>Registers shared durable background-job infrastructure and the feature message handlers.</summary>
public static class JobsDependencyInjection
{
    private const string WolverineSchema = "wolverine";

    /// <summary>Registers the durable queue and its workers, except during build-time OpenAPI generation.</summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The application configuration.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddBackgroundJobs(this IServiceCollection services, IConfiguration configuration)
    {
        if (ConfigurationDependencyInjection.IsGeneratingOpenApiDocument)
        {
            return services;
        }

        services.AddWolverineExtension<JobOptionsExtension>();
        var connectionString = configuration.GetConnectionString("DefaultConnection")
                               ?? throw new InvalidOperationException("The connection string 'DefaultConnection' is missing");
        services.AddWolverine(options =>
        {
            options.ApplicationAssembly = typeof(JobsDependencyInjection).Assembly;
            // Handler dependencies such as IAppDbContext are registered with factories, so Wolverine resolves them
            // from the message's service scope instead of constructing them inline.
            options.ServiceLocationPolicy = ServiceLocationPolicy.AlwaysAllowed;
            // Service-location code uses these types even when discovery does not see a direct handler dependency.
            options.CodeGeneration.ReferenceAssembly(typeof(IServiceScopeFactory).Assembly);
            options.Discovery.DisableConventionalDiscovery()
                .IncludeType(typeof(ImportMessageHandler))
                .IncludeType(typeof(DeleteUserAccountMessageHandler));
            options.PersistMessagesWithPostgresql(connectionString, WolverineSchema);
            options.UseEntityFrameworkCoreTransactions();
            options.Policies.UseDurableLocalQueues();
            options.OnException<NpgsqlException>().RetryWithCooldown(
                TimeSpan.FromSeconds(1),
                TimeSpan.FromSeconds(10),
                TimeSpan.FromSeconds(60));
            // Calls to the authentication provider when deleting an account can fail temporarily.
            options.OnException<HttpRequestException>().RetryWithCooldown(
                TimeSpan.FromSeconds(5),
                TimeSpan.FromSeconds(30),
                TimeSpan.FromMinutes(2));
        });
        services.AddScoped<IJobQueue, WolverineJobQueue>();

        return services;
    }

    private sealed class JobOptionsExtension(IOptions<JobsOptions> jobs) : IWolverineExtension
    {
        public void Configure(WolverineOptions options) => options.Durability.Mode = jobs.Value.DurabilityMode;
    }
}
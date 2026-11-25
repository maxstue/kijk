using Kijk.Infrastructure.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Infrastructure.Spaces;

/// <summary>Registers the background services of spaces.</summary>
internal static class SpacesDependencyInjection
{
    /// <summary>Registers the invitation cleanup.</summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddSpaces(this IServiceCollection services)
    {
        // Document generation must not touch the database.
        if (!ConfigurationDependencyInjection.IsGeneratingOpenApiDocument)
        {
            services.AddHostedService<InvitationCleanupService>();
        }

        return services;
    }
}
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Dashboard;

/// <summary>Registers the shared dashboard queries.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<Queries.QueriesHandler>();
        return services;
    }
}
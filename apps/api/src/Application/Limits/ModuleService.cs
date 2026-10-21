using Kijk.Application.Limits.Create;
using Kijk.Application.Limits.Delete;
using Kijk.Application.Limits.Queries;
using Kijk.Application.Limits.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Limits;

/// <summary>Registers the handlers and services owned by the Limits feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateHandler>();
        services.AddScoped<DeleteHandler>();
        services.AddScoped<QueriesHandler>();
        services.AddScoped<UpdateHandler>();

        return services;
    }
}
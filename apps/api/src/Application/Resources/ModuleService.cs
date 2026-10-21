using Kijk.Application.Resources.Create;
using Kijk.Application.Resources.Delete;
using Kijk.Application.Resources.Details;
using Kijk.Application.Resources.List;
using Kijk.Application.Resources.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Resources;

/// <summary>Registers the handlers and services owned by the Resources feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateHandler>();
        services.AddScoped<DeleteHandler>();
        services.AddScoped<ListHandler>();
        services.AddScoped<DetailsHandler>();
        services.AddScoped<UpdateHandler>();

        return services;
    }
}
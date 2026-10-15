using Kijk.Application.Resources.Create;
using Kijk.Application.Resources.Delete;
using Kijk.Application.Resources.GetAll;
using Kijk.Application.Resources.GetById;
using Kijk.Application.Resources.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Resources;

/// <summary>Registers the handlers and services owned by the Resources feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateResourceHandler>();
        services.AddScoped<DeleteResourceHandler>();
        services.AddScoped<GetAllResourcesHandler>();
        services.AddScoped<GetByIdResourceHandler>();
        services.AddScoped<UpdateResourceHandler>();

        return services;
    }
}
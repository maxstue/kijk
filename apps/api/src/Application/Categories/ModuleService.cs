using Kijk.Application.Categories.Create;
using Kijk.Application.Categories.Delete;
using Kijk.Application.Categories.List;
using Kijk.Application.Categories.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Categories;

/// <summary>Registers the handlers and services owned by the Categories feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateHandler>();
        services.AddScoped<DeleteHandler>();
        services.AddScoped<ListHandler>();
        services.AddScoped<UpdateHandler>();

        return services;
    }
}
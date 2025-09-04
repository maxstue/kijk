using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Resources;

/// <summary>
/// Module for resource usage.
/// <inheritdoc cref="IModule"/>
/// </summary>
public class ModuleService : IModule
{
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        // Validators
        services.AddScoped<IValidator<CreateResourceRequest>, CreateResourceRequestValidator>();

        // Handlers
        services.AddScoped<GetAllResourcesHandler>();
        services.AddScoped<CreateResourceHandler>();
        services.AddScoped<DeleteResourceHandler>();
        services.AddScoped<GetByIdResourceHandler>();
        services.AddScoped<UpdateResourceHandler>();

        return services;
    }
}
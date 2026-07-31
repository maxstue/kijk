using Kijk.Application.Resources.Create;
using Kijk.Application.Resources.Update;
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
        services.AddScoped<IValidator<UpdateResourceRequest>, UpdateResourceRequestValidator>();

        return services;
    }
}
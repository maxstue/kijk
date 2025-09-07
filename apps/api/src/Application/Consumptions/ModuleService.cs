using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Consumptions;

/// <summary>
/// Module for resource usage.
/// <inheritdoc cref="IModule"/>
/// </summary>
public class ModuleService : IModule
{
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        // Validators
        services.AddScoped<IValidator<CreateConsumptionRequest>, CreateConsumptionCommandValidator>();

        return services;
    }
}
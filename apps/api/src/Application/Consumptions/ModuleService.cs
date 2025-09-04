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
        // Handlers
        services.AddScoped<CreateConsumptionHandler>();
        services.AddScoped<DeleteConsumptionHandler>();
        services.AddScoped<GetByIdConsumptionHandler>();
        services.AddScoped<GetByYearMonthHandler>();
        services.AddScoped<GetStatsConsumptionsHandler>();
        services.AddScoped<GetYearsConsumptionHandler>();
        services.AddScoped<UpdateConsumptionHandler>();

        return services;
    }
}
using Kijk.Application.ConsumptionLimits.Create;
using Kijk.Application.ConsumptionLimits.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.ConsumptionLimits;

/// <summary>
/// Registers consumption limit services.
/// </summary>
public sealed class ModuleService : IModule
{
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateConsumptionLimitRequest>, CreateConsumptionLimitValidator>();
        services.AddScoped<IValidator<UpdateConsumptionLimitRequest>, UpdateConsumptionLimitValidator>();
        return services;
    }
}
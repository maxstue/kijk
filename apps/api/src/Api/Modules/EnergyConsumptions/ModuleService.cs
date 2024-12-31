namespace Kijk.Api.Modules.EnergyConsumptions;

public static class ModuleService
{
    public static IServiceCollection AddEnergyConsumptionsModule(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateEnergyConsumptionRequest>, CreateEnergyConsumptionValidator>();
        return services;
    }

}
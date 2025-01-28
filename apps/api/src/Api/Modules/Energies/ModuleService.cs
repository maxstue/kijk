namespace Kijk.Api.Modules.Energies;

public static class ModuleService
{
    public static IServiceCollection AddEnergyModule(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateEnergyRequest>, CreateEnergyValidator>();
        return services;
    }

}
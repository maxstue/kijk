using Kijk.Application.Energies.Models;
using Kijk.Application.Energies.Validators;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Energies;

public static class ModuleService
{
    public static IServiceCollection AddEnergyModule(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateEnergyRequest>, CreateEnergyValidator>();
        return services;
    }

}
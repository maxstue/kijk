using Kijk.Application.Households.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Households;

/// <summary>
/// Registers household feature services.
/// </summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<UpdateHouseholdRequest>, UpdateHouseholdRequestValidator>();
        return services;
    }
}
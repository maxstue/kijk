using Kijk.Application.Units.Create;
using Kijk.Application.Units.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Units;

/// <summary>
/// Registers unit feature services.
/// </summary>
public sealed class ModuleService : IModule
{
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateUnitRequest>, CreateUnitRequestValidator>();
        services.AddScoped<IValidator<UpdateUnitRequest>, UpdateUnitRequestValidator>();
        return services;
    }
}
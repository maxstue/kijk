using Kijk.Application.Units.List;
using Kijk.Application.Units.Shared;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Units;

/// <summary>Registers the handlers and services owned by the Units feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<ListHandler>();
        services.AddScoped<IUnitConversionService, UnitsNetConversionService>();

        return services;
    }
}
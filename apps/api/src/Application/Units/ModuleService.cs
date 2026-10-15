using Kijk.Application.Units.Create;
using Kijk.Application.Units.GetAll;
using Kijk.Application.Units.Manage;
using Kijk.Application.Units.Shared;
using Kijk.Application.Units.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Units;

/// <summary>Registers the handlers and services owned by the Units feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateUnitHandler>();
        services.AddScoped<GetAllUnitsHandler>();
        services.AddScoped<ManageUnitHandler>();
        services.AddScoped<UpdateUnitHandler>();
        services.AddScoped<IUnitConversionService, UnitsNetConversionService>();

        return services;
    }
}
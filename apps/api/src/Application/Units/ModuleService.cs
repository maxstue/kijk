using Kijk.Application.Units.Archive;
using Kijk.Application.Units.Create;
using Kijk.Application.Units.Delete;
using Kijk.Application.Units.List;
using Kijk.Application.Units.RemoveFromSpace;
using Kijk.Application.Units.Restore;
using Kijk.Application.Units.Shared;
using Kijk.Application.Units.ShareWithSpace;
using Kijk.Application.Units.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Units;

/// <summary>Registers the handlers and services owned by the Units feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateHandler>();
        services.AddScoped<ListHandler>();
        services.AddScoped<ArchiveHandler>();
        services.AddScoped<RestoreHandler>();
        services.AddScoped<ShareWithSpaceHandler>();
        services.AddScoped<RemoveFromSpaceHandler>();
        services.AddScoped<DeleteHandler>();
        services.AddScoped<UpdateHandler>();
        services.AddScoped<IUnitConversionService, UnitsNetConversionService>();

        return services;
    }
}
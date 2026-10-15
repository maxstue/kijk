using Kijk.Application.Consumptions.Create;
using Kijk.Application.Consumptions.Delete;
using Kijk.Application.Consumptions.Export;
using Kijk.Application.Consumptions.GetById;
using Kijk.Application.Consumptions.GetByYearMonth;
using Kijk.Application.Consumptions.GetStats;
using Kijk.Application.Consumptions.GetYears;
using Kijk.Application.Consumptions.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Consumptions;

/// <summary>Registers the handlers and services owned by the Consumptions feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateConsumptionHandler>();
        services.AddScoped<DeleteConsumptionHandler>();
        services.AddScoped<ExportConsumptionHandler>();
        services.AddScoped<GetByIdConsumptionHandler>();
        services.AddScoped<GetByYearMonthHandler>();
        services.AddScoped<GetStatsConsumptionsHandler>();
        services.AddScoped<GetYearsConsumptionHandler>();
        services.AddScoped<UpdateConsumptionHandler>();

        return services;
    }
}
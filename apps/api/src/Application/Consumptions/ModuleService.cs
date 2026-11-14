using Kijk.Application.Consumptions.Delete;
using Kijk.Application.Consumptions.Details;
using Kijk.Application.Consumptions.Export;
using Kijk.Application.Consumptions.Import;
using Kijk.Application.Consumptions.ImportTemplate;
using Kijk.Application.Consumptions.List;
using Kijk.Application.Consumptions.Record;
using Kijk.Application.Consumptions.Statistics;
using Kijk.Application.Consumptions.Update;
using Kijk.Application.Consumptions.Years;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Consumptions;

/// <summary>Registers the handlers and services owned by the Consumptions feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<RecordHandler>();
        services.AddScoped<DeleteHandler>();
        services.AddScoped<ExportHandler>();
        services.AddScoped<ImportHandler>();
        services.AddScoped<ImportTemplateHandler>();
        services.AddScoped<DetailsHandler>();
        services.AddScoped<ListHandler>();
        services.AddScoped<StatisticsHandler>();
        services.AddScoped<YearsHandler>();
        services.AddScoped<UpdateHandler>();

        return services;
    }
}
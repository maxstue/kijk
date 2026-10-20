using Kijk.Application.Transactions.Categorize;
using Kijk.Application.Transactions.CategorizeMany;
using Kijk.Application.Transactions.Delete;
using Kijk.Application.Transactions.Export;
using Kijk.Application.Transactions.Queries;
using Kijk.Application.Transactions.Record;
using Kijk.Application.Transactions.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Transactions;

/// <summary>Registers the handlers and services owned by the Transactions feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CategorizeHandler>();
        services.AddScoped<CategorizeManyHandler>();
        services.AddScoped<RecordHandler>();
        services.AddScoped<DeleteHandler>();
        services.AddScoped<ExportHandler>();
        services.AddScoped<QueriesHandler>();
        services.AddScoped<UpdateHandler>();

        return services;
    }
}
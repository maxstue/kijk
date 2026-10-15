using Kijk.Application.Transactions.Categorize;
using Kijk.Application.Transactions.Create;
using Kijk.Application.Transactions.Delete;
using Kijk.Application.Transactions.Export;
using Kijk.Application.Transactions.Get;
using Kijk.Application.Transactions.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Transactions;

/// <summary>Registers the handlers and services owned by the Transactions feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CategorizeTransactionHandler>();
        services.AddScoped<CategorizeTransactionsHandler>();
        services.AddScoped<CreateTransactionHandler>();
        services.AddScoped<DeleteTransactionHandler>();
        services.AddScoped<ExportTransactionsHandler>();
        services.AddScoped<GetTransactionsHandler>();
        services.AddScoped<UpdateTransactionHandler>();

        return services;
    }
}
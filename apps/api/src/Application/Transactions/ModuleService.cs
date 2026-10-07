using Kijk.Application.Transactions.Categorize;
using Kijk.Application.Transactions.Create;
using Kijk.Application.Transactions.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Transactions;

/// <summary>
/// Registers transaction services.
/// </summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateTransactionRequest>, CreateTransactionValidator>();
        services.AddScoped<IValidator<UpdateTransactionRequest>, UpdateTransactionValidator>();
        services.AddScoped<IValidator<CategorizeTransactionsRequest>, CategorizeTransactionsValidator>();
        return services;
    }
}
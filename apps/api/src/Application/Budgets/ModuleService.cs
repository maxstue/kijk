using Kijk.Application.Budgets.Create;
using Kijk.Application.Budgets.Delete;
using Kijk.Application.Budgets.Get;
using Kijk.Application.Budgets.Statistics;
using Kijk.Application.Budgets.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Budgets;

/// <summary>Registers the handlers and services owned by the Budgets feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateBudgetHandler>();
        services.AddScoped<DeleteBudgetHandler>();
        services.AddScoped<GetBudgetsHandler>();
        services.AddScoped<GetBudgetStatisticsHandler>();
        services.AddScoped<UpdateBudgetHandler>();

        return services;
    }
}
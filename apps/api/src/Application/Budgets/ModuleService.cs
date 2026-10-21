using Kijk.Application.Budgets.DeleteVersion;
using Kijk.Application.Budgets.Queries;
using Kijk.Application.Budgets.SetFromMonth;
using Kijk.Application.Budgets.Statistics;
using Kijk.Application.Budgets.UpdateVersion;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Budgets;

/// <summary>Registers the handlers and services owned by the Budgets feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<SetFromMonthHandler>();
        services.AddScoped<DeleteVersionHandler>();
        services.AddScoped<QueriesHandler>();
        services.AddScoped<StatisticsHandler>();
        services.AddScoped<UpdateVersionHandler>();

        return services;
    }
}
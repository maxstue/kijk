using Kijk.Application.Budgets.Create;
using Kijk.Application.Budgets.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Budgets;

/// <summary>
/// Registers budget services.
/// </summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateBudgetRequest>, CreateBudgetValidator>();
        services.AddScoped<IValidator<UpdateBudgetRequest>, UpdateBudgetValidator>();
        return services;
    }
}
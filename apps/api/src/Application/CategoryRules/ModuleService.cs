using Kijk.Application.CategoryRules.Delete;
using Kijk.Application.CategoryRules.Get;
using Kijk.Application.CategoryRules.Suggestions;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.CategoryRules;

/// <summary>Registers the handlers and services owned by the CategoryRules feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<DeleteCategoryRuleHandler>();
        services.AddScoped<GetCategoryRulesHandler>();
        services.AddScoped<GetCategoryRuleSuggestionsHandler>();

        return services;
    }
}
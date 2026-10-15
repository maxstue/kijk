using Kijk.Application.Categories.Create;
using Kijk.Application.Categories.Delete;
using Kijk.Application.Categories.Get;
using Kijk.Application.Categories.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Categories;

/// <summary>Registers the handlers and services owned by the Categories feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateCategoryHandler>();
        services.AddScoped<DeleteCategoryHandler>();
        services.AddScoped<GetCategoriesHandler>();
        services.AddScoped<UpdateCategoryHandler>();

        return services;
    }
}
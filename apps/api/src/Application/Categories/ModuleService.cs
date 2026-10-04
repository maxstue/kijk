using Kijk.Application.Categories.Create;
using Kijk.Application.Categories.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Categories;

/// <summary>
/// Registers category services.
/// </summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateCategoryRequest>, CreateCategoryValidator>();
        services.AddScoped<IValidator<UpdateCategoryRequest>, UpdateCategoryValidator>();
        return services;
    }
}
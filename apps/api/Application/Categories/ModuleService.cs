using Kijk.Application.Categories.Models;
using Kijk.Application.Categories.Validators;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Categories;

public static class ModuleService
{
    public static IServiceCollection AddCategoriesModule(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateCategoryRequest>, CreateCategoryValidator>();

        return services;
    }
}
namespace Kijk.Api.Modules.Categories;

public static class ModuleService
{
    public static IServiceCollection AddCategoriesModule(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateCategoryRequest>, CreateCategoryValidator>();

        return services;
    }
}
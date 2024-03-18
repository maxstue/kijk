namespace Kijk.Api.Application.Categories;

public static class CategoriesModule
{
    public static IServiceCollection RegisterCategoriesModule(this IServiceCollection services)
    {
        services.AddScoped<CategoriesService>();

        services.AddScoped<IValidator<CreateCategoryRequest>, CreateCategoryValidator>();

        return services;
    }
}

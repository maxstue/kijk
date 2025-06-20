using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services) => services.AddModules();

    /// <summary>
    /// Registers all modules by reflection that implement <see cref="IModule"/>.
    /// </summary>
    /// <param name="services"></param>
    /// <returns></returns>
    private static IServiceCollection AddModules(this IServiceCollection services)
    {
        var modules = typeof(IModule).Assembly
            .GetTypes()
            .Where(p => p.IsClass && p.IsAssignableTo(typeof(IModule)))
            .Select(Activator.CreateInstance)
            .Cast<IModule>();

        foreach (var module in modules)
        {
            module.RegisterServices(services);
        }

        return services;
    }
}
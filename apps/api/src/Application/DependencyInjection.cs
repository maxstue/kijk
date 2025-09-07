using System.Collections.Immutable;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddModules()
            .AddHandlers();

        return services;
    }

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

    /// <summary>
    /// Registers all handlers by reflection that implement <see cref="IHandler"/>.
    /// </summary>
    /// <param name="services"></param>
    /// <returns></returns>
    public static IServiceCollection AddHandlers(this IServiceCollection services)
    {
        var handlerTypes = typeof(IHandler).Assembly
            .GetTypes()
            .Where(t => t.IsClass && typeof(IHandler).IsAssignableFrom(t));

        foreach (var impl in handlerTypes)
        {
            var interfaces = impl.GetInterfaces().Where(i => i != typeof(IHandler)).ToImmutableList();
            if (interfaces.IsEmpty)
            {
                services.AddTransient(impl);
                continue;
            }

            foreach (var @interface in interfaces)
            {
                services.AddTransient(@interface, impl);
            }
        }
        return services;
    }
}
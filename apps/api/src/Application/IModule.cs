using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application;

/// <summary>
/// Owns the explicit registration of a feature's handlers and injectable services.
/// Modules are discovered automatically; FluentValidation validators are registered separately by a source generator.
/// </summary>
public interface IModule
{
    /// <summary>
    /// Registers services for the module.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection.</returns>
    IServiceCollection RegisterServices(IServiceCollection services);
}
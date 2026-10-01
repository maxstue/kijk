using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application;

/// <summary>
/// Classes implementing this interface will be automatically registered on startup.
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
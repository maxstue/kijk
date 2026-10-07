using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.App;

/// <summary>
/// Module for app.
/// </summary>
public class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services) => services;
}
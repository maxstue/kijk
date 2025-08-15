using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.App;

/// <summary>
/// Module for app.
/// </summary>
public class ModuleService : IModule
{
    public IServiceCollection RegisterServices(IServiceCollection services) => services;
}
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Users;

/// <summary>
/// Module for users.
/// <inheritdoc cref="IModule"/>
/// </summary>
public class ModuleService : IModule
{
    public IServiceCollection RegisterServices(IServiceCollection services) => services;
}
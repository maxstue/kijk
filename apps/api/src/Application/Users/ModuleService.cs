using Kijk.Application.Users.Update;
using Kijk.Application.Users.Welcome;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Users;

/// <summary>
/// Module for users.
/// <inheritdoc cref="IModule"/>
/// </summary>
public class ModuleService : IModule
{
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<UpdateUserRequest>, UpdateUserRequestValidator>();
        services.AddScoped<IValidator<WelcomeUserRequest>, WelcomeUserRequestValidator>();
        return services;
    }
}
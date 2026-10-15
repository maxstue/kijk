using Kijk.Application.Users.Delete;
using Kijk.Application.Users.GetMe;
using Kijk.Application.Users.SwitchSpace;
using Kijk.Application.Users.Update;
using Kijk.Application.Users.Welcome;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Users;

/// <summary>Registers the handlers and services owned by the Users feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<AccountEraser>();
        services.AddScoped<RequestAccountDeletionHandler>();
        services.AddScoped<GetMeUserHandler>();
        services.AddScoped<SwitchSpaceHandler>();
        services.AddScoped<UpdateUserHandler>();
        services.AddScoped<WelcomeUserHandler>();

        return services;
    }
}
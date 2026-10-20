using Kijk.Application.Users.CompleteOnboarding;
using Kijk.Application.Users.Delete;
using Kijk.Application.Users.Me;
using Kijk.Application.Users.RequestDeletion;
using Kijk.Application.Users.SetDefaultSpace;
using Kijk.Application.Users.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Users;

/// <summary>Registers the handlers and services owned by the Users feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<AccountEraser>();
        services.AddScoped<RequestDeletionHandler>();
        services.AddScoped<SetDefaultSpaceHandler>();
        services.AddScoped<MeHandler>();
        services.AddScoped<UpdateHandler>();
        services.AddScoped<CompleteOnboardingHandler>();

        return services;
    }
}
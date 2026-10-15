using Kijk.Application.Accounts.Create;
using Kijk.Application.Accounts.Delete;
using Kijk.Application.Accounts.Get;
using Kijk.Application.Accounts.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Accounts;

/// <summary>Registers the handlers and services owned by the Accounts feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<CreateAccountHandler>();
        services.AddScoped<DeleteAccountHandler>();
        services.AddScoped<GetAccountsHandler>();
        services.AddScoped<UpdateAccountHandler>();

        return services;
    }
}
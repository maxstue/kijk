using Kijk.Application.Accounts.Create;
using Kijk.Application.Accounts.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Accounts;

/// <summary>
/// Registers account services.
/// </summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateAccountRequest>, CreateAccountValidator>();
        services.AddScoped<IValidator<UpdateAccountRequest>, UpdateAccountValidator>();
        return services;
    }
}
using Kijk.Application.Spaces.ChangeMemberRole;
using Kijk.Application.Spaces.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Spaces;

/// <summary>
/// Registers space feature services.
/// </summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<IValidator<UpdateSpaceRequest>, UpdateSpaceRequestValidator>();
        services.AddScoped<IValidator<ChangeMemberRoleRequest>, ChangeMemberRoleRequestValidator>();
        return services;
    }
}
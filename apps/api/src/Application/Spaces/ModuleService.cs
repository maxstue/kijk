using Kijk.Application.Spaces.ChangeMemberRole;
using Kijk.Application.Spaces.Delete;
using Kijk.Application.Spaces.Members;
using Kijk.Application.Spaces.Roles;
using Kijk.Application.Spaces.Update;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Application.Spaces;

/// <summary>Registers the handlers and services owned by the Spaces feature.</summary>
public sealed class ModuleService : IModule
{
    /// <inheritdoc />
    public IServiceCollection RegisterServices(IServiceCollection services)
    {
        services.AddScoped<ChangeMemberRoleHandler>();
        services.AddScoped<DeleteHandler>();
        services.AddScoped<MembersHandler>();
        services.AddScoped<RolesHandler>();
        services.AddScoped<UpdateHandler>();

        return services;
    }
}
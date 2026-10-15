using Kijk.Application.Spaces.ChangeMemberRole;
using Kijk.Application.Spaces.Delete;
using Kijk.Application.Spaces.GetMembers;
using Kijk.Application.Spaces.GetRoles;
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
        services.AddScoped<DeleteSpaceHandler>();
        services.AddScoped<GetSpaceMembersHandler>();
        services.AddScoped<GetSpaceRolesHandler>();
        services.AddScoped<UpdateSpaceHandler>();

        return services;
    }
}
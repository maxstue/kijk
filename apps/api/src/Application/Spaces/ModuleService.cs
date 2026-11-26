using Kijk.Application.Spaces.ChangeMemberRole;
using Kijk.Application.Spaces.CleanupInvitations;
using Kijk.Application.Spaces.Create;
using Kijk.Application.Spaces.CreateInvitation;
using Kijk.Application.Spaces.Delete;
using Kijk.Application.Spaces.Invitations;
using Kijk.Application.Spaces.Members;
using Kijk.Application.Spaces.RevokeInvitation;
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
        services.AddScoped<CleanupInvitationsHandler>();
        services.AddScoped<CreateHandler>();
        services.AddScoped<CreateInvitationHandler>();
        services.AddScoped<DeleteHandler>();
        services.AddScoped<InvitationsHandler>();
        services.AddScoped<MembersHandler>();
        services.AddScoped<RevokeInvitationHandler>();
        services.AddScoped<RolesHandler>();
        services.AddScoped<UpdateHandler>();

        return services;
    }
}
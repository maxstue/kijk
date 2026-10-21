using Kijk.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Authorizes users whose role in the active space grants the required permission.
/// The permissions are resolved once per request by the current-user middleware.
/// </summary>
public sealed class SpacePermissionAuthorizationHandler(
    CurrentUser currentUser,
    ILogger<SpacePermissionAuthorizationHandler> logger)
    : AuthorizationHandler<SpacePermissionRequirement>
{
    /// <inheritdoc />
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        SpacePermissionRequirement requirement)
    {
        if (currentUser.IsReady && currentUser.HasSpacePermission(requirement.Permission))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (currentUser.IsReady)
        {
            logger.LogWarning(
                "User '{UserId}' with role '{Role}' lacks permission '{Permission}' in space '{SpaceId}'",
                currentUser.Id,
                currentUser.SpaceRole,
                requirement.Permission,
                currentUser.ActiveSpaceId);
        }

        return Task.CompletedTask;
    }
}
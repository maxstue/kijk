using Kijk.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Authorizes users whose role in the active household grants the required permission.
/// The permissions are resolved once per request by the current-user middleware.
/// </summary>
public sealed class HouseholdPermissionAuthorizationHandler(
    CurrentUser currentUser,
    ILogger<HouseholdPermissionAuthorizationHandler> logger)
    : AuthorizationHandler<HouseholdPermissionRequirement>
{
    /// <inheritdoc />
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        HouseholdPermissionRequirement requirement)
    {
        if (currentUser.IsReady && currentUser.HasHouseholdPermission(requirement.Permission))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (currentUser.IsReady)
        {
            logger.LogWarning(
                "User '{UserId}' with role '{Role}' lacks permission '{Permission}' in household '{HouseholdId}'",
                currentUser.Id,
                currentUser.HouseholdRole,
                requirement.Permission,
                currentUser.ActiveHouseholdId);
        }

        return Task.CompletedTask;
    }
}
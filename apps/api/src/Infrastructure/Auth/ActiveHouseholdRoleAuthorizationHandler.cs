using Kijk.Application.Shared.Persistence;
using Kijk.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Authorizes users whose active household membership has one of the required roles.
/// </summary>
public sealed class ActiveHouseholdRoleAuthorizationHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    ILogger<ActiveHouseholdRoleAuthorizationHandler> logger)
    : AuthorizationHandler<ActiveHouseholdRoleRequirement>
{
    /// <inheritdoc />
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ActiveHouseholdRoleRequirement requirement)
    {
        if (!currentUser.IsReady || currentUser.ActiveHouseholdId is not { } activeHouseholdId)
        {
            return;
        }

        var cancellationToken = context.Resource is HttpContext httpContext
            ? httpContext.RequestAborted
            : CancellationToken.None;

        var activeRole = await dbContext.UserHouseholds
            .Where(userHousehold =>
                userHousehold.UserId == currentUser.Id
                && userHousehold.HouseholdId == activeHouseholdId
                && userHousehold.IsActive)
            .Select(userHousehold => userHousehold.Role.Name)
            .SingleOrDefaultAsync(cancellationToken);

        if (activeRole is not null && requirement.AllowedRoles.Contains(activeRole, StringComparer.Ordinal))
        {
            context.Succeed(requirement);
            return;
        }

        logger.LogWarning(
            "User '{UserId}' with role '{Role}' does not satisfy required household roles '{RequiredRoles}' in household '{HouseholdId}'",
            currentUser.Id,
            activeRole,
            requirement.AllowedRoles,
            activeHouseholdId);
    }
}
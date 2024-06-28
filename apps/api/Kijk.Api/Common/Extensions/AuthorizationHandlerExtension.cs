using Kijk.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;

namespace Kijk.Api.Common.Extensions;

public static class AuthorizationHandlerExtensions
{
    // Adds the current user requirement that will activate our authorization handler
    public static AuthorizationPolicyBuilder RequireCurrentUser(this AuthorizationPolicyBuilder builder)
    {
        return builder.RequireAuthenticatedUser().AddRequirements(new CheckCurrentUserRequirement());
    }
}

public class CheckCurrentUserRequirement : IAuthorizationRequirement
{
}

// This authorization handler verifies that the user exists even if there's a valid token
public class CheckCurrentUserAuthHandler(CurrentUser currentUser) : AuthorizationHandler<CheckCurrentUserRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, CheckCurrentUserRequirement requirement)
    {
        if (currentUser is { User.AuthId: not null } and { Principal: not null })
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

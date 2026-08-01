using Kijk.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Authorizes authenticated identities that have completed Kijk onboarding.
/// </summary>
public sealed class OnboardingCompletedAuthorizationHandler(
    CurrentUser currentUser,
    ILogger<OnboardingCompletedAuthorizationHandler> logger)
    : AuthorizationHandler<OnboardingCompletedRequirement>
{
    /// <inheritdoc />
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OnboardingCompletedRequirement requirement)
    {
        if (currentUser.IsReady)
        {
            context.Succeed(requirement);
        }
        else
        {
            logger.LogWarning("Authenticated identity '{AuthId}' has not completed onboarding", currentUser.AuthId);
        }

        return Task.CompletedTask;
    }
}
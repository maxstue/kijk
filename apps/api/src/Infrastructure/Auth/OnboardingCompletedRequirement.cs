using Microsoft.AspNetCore.Authorization;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Requires the authenticated identity to have completed Kijk onboarding.
/// </summary>
public sealed class OnboardingCompletedRequirement : IAuthorizationRequirement;
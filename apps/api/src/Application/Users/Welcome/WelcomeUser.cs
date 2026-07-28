using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Users.Shared;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.Welcome;

/// <summary>
/// Handler for creating a new user after the welcome process.
/// </summary>
public class WelcomeUserHandler(
    IAppDbContext dbContext,
    IIdentityProvider identityProvider,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    ILogger<WelcomeUserHandler> logger) : IHandler
{
    public async Task<Result<UserResponse>> WelcomeAsync(WelcomeUserRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .Include(x => x.Resources)
            .Include(x => x.UserHouseholds)
            .ThenInclude(x => x.Household)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            logger.LogError("User not found: {UserId}", currentUser.Id);
            return Error.NotFound("User not found");
        }

        if (user.OnboardingCompleted)
        {
            logger.LogError("User is already welcome");
            return Error.Conflict("User has already completed the welcome flow");
        }

        var activeHousehold = user.UserHouseholds
            .SingleOrDefault(userHousehold => userHousehold.IsActive)
            ?.Household;

        if (activeHousehold is null)
        {
            logger.LogError("Active household not found for user: {UserId}", currentUser.Id);
            return Error.NotFound("Active household not found");
        }

        var defaultResources = await dbContext.Resources
            .Where(resource => resource.CreatorType == CreatorType.System)
            .ToListAsync(cancellationToken);

        var completedAt = timeProvider.GetUtcNow().UtcDateTime;
        activeHousehold.Rename(request.HouseholdName.Trim());
        user.SetDefaultResources(request.UseDefaultResources, defaultResources);
        user.CompleteOnboarding(request.DisplayName.Trim(), request.AnalyticsConsent, completedAt);

        await identityProvider.SetUseProfileInKijkAsync(currentUser.AuthId, request.UseExternalProfile, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return user.ToResponse(user.Resources.Any(resource => resource.CreatorType == CreatorType.System));
    }
}
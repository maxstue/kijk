using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Users.GetMe;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.Welcome;

/// <summary>
/// Handler for completing onboarding and provisioning an account only when required.
/// </summary>
public class WelcomeUserHandler(
    IAppDbContext dbContext,
    IIdentityProvider identityProvider,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    ILogger<WelcomeUserHandler> logger,
    GetMeUserHandler getMeUserHandler) : IHandler
{
    /// <summary>
    /// Creates or completes the current Kijk account and returns its resulting state.
    /// </summary>
    /// <param name="request">The submitted onboarding details.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The ready account representation.</returns>
    public async Task<Result<CurrentUserResponse>> WelcomeAsync(WelcomeUserRequest request, CancellationToken cancellationToken)
    {
        var externalIdentity = await identityProvider.GetAsync(currentUser.AuthId, cancellationToken);
        var user = await dbContext.Users
            .Where(x => x.AuthId == currentUser.AuthId)
            .Include(x => x.Resources)
            .Include(x => x.UserSpaces)
            .ThenInclude(x => x.Space)
            .AsSplitQuery()
            .FirstOrDefaultAsync(cancellationToken);

        if (user?.OnboardingCompleted is true)
        {
            return await getMeUserHandler.GetMeAsync(cancellationToken);
        }

        if (user is null)
        {
            user = User.Init(currentUser.AuthId, request.DisplayName.Trim(), externalIdentity.Email);
            dbContext.Users.Add(user);
        }

        var activeSpace = user.UserSpaces
            .SingleOrDefault(userSpace => userSpace.IsActive)
            ?.Space;

        if (activeSpace is null)
        {
            // The user who creates a space becomes its administrator.
            var adminRole = await dbContext.Roles.SingleOrDefaultAsync(role => role.Id == SpaceRoles.Admin.Id, cancellationToken);
            if (adminRole is null)
            {
                logger.LogError("Admin role was not found");
                return Error.Unexpected("Role was not found");
            }

            activeSpace = Space.Create(request.SpaceName.Trim());
            user.UserSpaces.Add(UserSpace.Create(user, activeSpace, adminRole, true));
            if (!user.UserSpaces.Any(link => link.Space.IsPersonal))
            {
                // Every user also gets a personal space that is never shared.
                user.UserSpaces.Add(UserSpace.Create(user, Space.CreatePersonal(), adminRole));
            }
        }

        var defaultResources = await dbContext.Resources
            .Where(resource => resource.CreatorType == CreatorType.System)
            .ToListAsync(cancellationToken);

        var completedAt = timeProvider.GetUtcNow().UtcDateTime;
        activeSpace.Rename(request.SpaceName.Trim());
        user.SetDefaultResources(request.UseDefaultResources, defaultResources);
        user.CompleteOnboarding(request.DisplayName.Trim(), request.AnalyticsConsent, completedAt);

        await identityProvider.SetUseProfileInKijkAsync(currentUser.AuthId, request.UseExternalProfile, cancellationToken);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var completedUserExists = await dbContext.Users
                .AsNoTracking()
                .AnyAsync(existingUser => existingUser.AuthId == currentUser.AuthId && existingUser.OnboardingCompletedAt != null, cancellationToken);

            if (!completedUserExists)
            {
                throw;
            }
        }

        return await getMeUserHandler.GetMeAsync(cancellationToken);
    }
}
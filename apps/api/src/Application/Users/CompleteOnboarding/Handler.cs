using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Users.Me;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.CompleteOnboarding;

/// <summary>
/// Handler for completing onboarding and provisioning an account only when required.
/// </summary>
public class CompleteOnboardingHandler(
    IAppDbContext dbContext,
    IIdentityProvider identityProvider,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    ILogger<CompleteOnboardingHandler> logger,
    MeHandler getMeUserHandler)
{
    /// <summary>
    /// Creates or completes the current Kijk account and returns its resulting state.
    /// </summary>
    /// <param name="request">The submitted onboarding details.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The ready account representation.</returns>
    public async Task<Result<CurrentUserResponse>> HandleAsync(WelcomeUserRequest request, CancellationToken cancellationToken)
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
            return await getMeUserHandler.HandleAsync(cancellationToken);
        }

        if (user is null)
        {
            user = User.Init(currentUser.AuthId, request.DisplayName.Trim(), externalIdentity.Email);
            dbContext.Users.Add(user);
        }

        // A retried onboarding reuses the space the first attempt created.
        var firstSpace = user.UserSpaces
            .Select(userSpace => userSpace.Space)
            .FirstOrDefault(space => !space.IsPersonal);

        if (firstSpace is null)
        {
            // The user who creates a space becomes its administrator.
            var adminRole = await dbContext.Roles.SingleOrDefaultAsync(role => role.Id == SpaceRoles.Admin.Id, cancellationToken);
            if (adminRole is null)
            {
                logger.LogError(new InvalidOperationException("Admin role was not found"), "Onboarding could not create the first space");
                return Error.Unexpected("Role was not found");
            }

            firstSpace = Space.Create(request.SpaceName.Trim());
            user.UserSpaces.Add(UserSpace.Create(user, firstSpace, adminRole));
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
        firstSpace.Rename(request.SpaceName.Trim());
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

        return await getMeUserHandler.HandleAsync(cancellationToken);
    }
}
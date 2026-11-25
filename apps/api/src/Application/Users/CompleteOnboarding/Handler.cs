using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
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
        // A completed account stays unchanged, including its profile setting at the identity provider.
        if (currentUser.IsReady)
        {
            return await getMeUserHandler.HandleAsync(cancellationToken);
        }

        // Unusable tokens fail before any call to the identity provider, so trying tokens costs only a cheap query.
        if (request.InvitationToken is { } candidate
            && !await dbContext.IsPendingInvitationAsync(candidate, timeProvider.GetUtcNow().UtcDateTime, cancellationToken))
        {
            return InvitationLookup.Invalid;
        }

        var externalIdentity = await identityProvider.GetAsync(currentUser.AuthId, cancellationToken);
        // Calls to the identity provider stay outside the transaction, so no lock is held while waiting for it.
        // Setting the flag again on a retry is harmless.
        await identityProvider.SetUseProfileInKijkAsync(currentUser.AuthId, request.UseExternalProfile, cancellationToken);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Locking the invitation before reading the account makes a parallel retry wait and then find it completed.
        var invitation = request.InvitationToken is { } token
            ? await dbContext.LockInvitationAsync(token, cancellationToken)
            : null;

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

        var completedAt = timeProvider.GetUtcNow().UtcDateTime;
        if (request.InvitationToken is not null && invitation?.IsPending(completedAt) is not true)
        {
            // Never complete without the space the user expects to join.
            return InvitationLookup.Invalid;
        }

        var adminRole = await dbContext.Roles.SingleOrDefaultAsync(role => role.Id == SpaceRoles.Admin.Id, cancellationToken);
        if (adminRole is null)
        {
            logger.LogError(new InvalidOperationException("Admin role was not found"), "Onboarding could not create the personal space");
            return Error.Unexpected("Role was not found");
        }

        if (user is null)
        {
            user = User.Init(currentUser.AuthId, request.DisplayName.Trim(), externalIdentity.Email);
            dbContext.Users.Add(user);
        }

        // Every user starts with a personal space that is never shared. Shared spaces are created later, or joined
        // through an invitation.
        var personalSpace = user.UserSpaces.Select(link => link.Space).FirstOrDefault(space => space.IsPersonal);
        if (personalSpace is null)
        {
            personalSpace = Space.CreatePersonal();
            user.UserSpaces.Add(UserSpace.Create(user, personalSpace, adminRole));
        }

        if (request.SpaceName?.Trim() is { Length: > 0 } spaceName)
        {
            personalSpace.Rename(spaceName);
        }

        if (invitation is not null)
        {
            JoinInvitedSpace(user, invitation, completedAt);
        }

        var defaultResources = await dbContext.Resources
            .Where(resource => resource.CreatorType == CreatorType.System)
            .ToListAsync(cancellationToken);

        user.SetDefaultResources(request.UseDefaultResources, defaultResources);
        user.CompleteOnboarding(request.DisplayName.Trim(), request.AnalyticsConsent, completedAt);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // A parallel request created the account first; its result counts.
            await transaction.RollbackAsync(cancellationToken);
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

    private static void JoinInvitedSpace(User user, SpaceInvitation invitation, DateTime utcNow)
    {
        // Onboarding only restarts for users left without any space (see Spaces/Delete), so the user is no member
        // of the invited space yet and has no default space.
        var membership = invitation.AcceptFor(user, utcNow);
        membership.SetDefault(true);
        user.UserSpaces.Add(membership);
    }
}
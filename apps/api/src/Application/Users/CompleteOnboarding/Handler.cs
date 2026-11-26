using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Jobs;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Security;
using Kijk.Application.Spaces.Shared;
using Kijk.Application.Users.Me;
using Kijk.Application.Users.Shared;
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
    IJobQueue queue,
    IPseudonymizer pseudonymizer,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    ILogger<CompleteOnboardingHandler> logger,
    UniqueNameSaver uniqueNameSaver,
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

        // Every user starts with a personal space that is never shared; a retried onboarding reuses it. Shared spaces
        // are created later or joined through an invitation.
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

        var defaultResources = await dbContext.Resources
            .Where(resource => resource.CreatorType == CreatorType.System)
            .ToListAsync(cancellationToken);

        var completedAt = timeProvider.GetUtcNow().UtcDateTime;
        user.SetDefaultResources(request.UseDefaultResources, defaultResources);
        user.CompleteOnboarding(request.DisplayName.Trim(), request.AnalyticsConsent, completedAt);

        await identityProvider.SetUseProfileInKijkAsync(currentUser.AuthId, request.UseExternalProfile, cancellationToken);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            if (await uniqueNameSaver.SaveAsync(user, cancellationToken) is { } conflict)
            {
                return conflict;
            }
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            // A parallel request created the account first; its result counts.
            var completedUserExists = await dbContext.Users
                .AsNoTracking()
                .AnyAsync(existingUser => existingUser.AuthId == currentUser.AuthId && existingUser.OnboardingCompletedAt != null, cancellationToken);

            if (!completedUserExists)
            {
                throw;
            }

            return await getMeUserHandler.HandleAsync(cancellationToken);
        }

        await LinkInvitationsAsync(externalIdentity, completedAt, cancellationToken);
        if (externalIdentity.InvitationId is not null)
        {
            // The outbox commits the onboarding and the metadata cleanup together.
            await queue.SaveChangesAndEnqueueAsync(new ClearInvitationMetadata(currentUser.AuthId), cancellationToken);
        }
        else
        {
            await transaction.CommitAsync(cancellationToken);
        }

        return await getMeUserHandler.HandleAsync(cancellationToken);
    }

    private async Task LinkInvitationsAsync(ExternalIdentity identity, DateTime utcNow, CancellationToken cancellationToken)
    {
        var fingerprints = identity.VerifiedEmails.Select(email => InvitationEmail.Fingerprint(pseudonymizer, email)).ToArray();
        if (fingerprints.Length == 0 && identity.InvitationId is null)
        {
            return;
        }

        var authId = currentUser.AuthId;
        var unbound = dbContext.SpaceInvitations
            .Where(item => item.InviteeAuthId == null && item.ProviderInvitationId != null)
            .Pending(utcNow);
        var matches = await unbound
            .Where(item => item.EmailFingerprint != null && fingerprints.Contains(item.EmailFingerprint)
                || item.EmailFingerprint == null && item.Id == identity.InvitationId)
            .OrderBy(item => item.SpaceId).ThenBy(item => item.CreatedAt).ThenBy(item => item.Id)
            .Select(item => new { item.Id, item.SpaceId })
            .ToListAsync(cancellationToken);

        foreach (var match in matches)
        {
            var invitations = dbContext.SpaceInvitations.Unclosed()
                .Where(item => item.SpaceId == match.SpaceId && item.InviteeAuthId == authId);
            await invitations.CloseExpiredAsync(utcNow, cancellationToken);
            await unbound.Where(item => item.Id == match.Id && !invitations.Any())
                .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.InviteeAuthId, authId), cancellationToken);
        }
    }
}
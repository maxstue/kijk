using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Users.Shared;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.Update;

/// <summary>
/// Handler for updating a user.
/// </summary>
public class UpdateUserHandler(
    IAppDbContext dbContext,
    IIdentityProvider identityProvider,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    ILogger<UpdateUserHandler> logger) : IHandler
{
    /// <summary>
    /// Updates the current user's settings. Renaming the active household additionally requires the
    /// household:configure permission there; sending the unchanged name is always allowed.
    /// </summary>
    /// <param name="request">The changes.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated settings.</returns>
    public async Task<Result<UserResponse>> UpdateAsync(UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .Include(x => x.Resources)
            .Include(x => x.UserHouseholds)
            .ThenInclude(x => x.Household)
            .AsSplitQuery()
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            logger.LogWarning("User with id '{Id}' not found", currentUser.Id);
            return Error.NotFound("User not found");
        }

        if (request.UserName is not null)
        {
            userEntity.Name = request.UserName.Trim();
        }

        if (request.HouseholdName is not null
            && await RenameActiveHouseholdAsync(userEntity, request.HouseholdName.Trim(), cancellationToken) is { } renameError)
        {
            return renameError;
        }

        if (request.AnalyticsConsent is not null)
        {
            userEntity.UpdateAnalyticsConsent(request.AnalyticsConsent.Value, timeProvider.GetUtcNow().UtcDateTime);
        }

        if (request.UseExternalProfile is not null)
        {
            await identityProvider.SetUseProfileInKijkAsync(currentUser.AuthId, request.UseExternalProfile.Value, cancellationToken);
        }

        await SetDefaultResourcesAsync(userEntity, request.UseDefaultResources, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return userEntity.ToResponse(userEntity.Resources.Any(resource => resource.CreatorType == CreatorType.System));
    }

    /// <summary>Renames the user's active household; a changed name requires the household:configure permission.</summary>
    private async Task<Error?> RenameActiveHouseholdAsync(User user, string householdName, CancellationToken cancellationToken)
    {
        var activeHousehold = user.UserHouseholds.SingleOrDefault(x => x.IsActive)?.Household;
        if (activeHousehold is null)
        {
            logger.LogWarning("Active household for user with id '{Id}' not found", currentUser.Id);
            return Error.NotFound("Active household not found");
        }

        if (string.Equals(householdName, activeHousehold.Name, StringComparison.Ordinal))
        {
            return null;
        }

        if (await dbContext.AuthorizeHouseholdAsync(currentUser.Id, activeHousehold.Id, HouseholdPermissions.Household.Configure, cancellationToken) is { } error)
        {
            return error;
        }

        activeHousehold.Rename(householdName);
        return null;
    }

    /// <summary>Enables or disables the system default resources when the requested state differs.</summary>
    private async Task SetDefaultResourcesAsync(User user, bool? useDefaultResources, CancellationToken cancellationToken)
    {
        var hasDefaultResources = user.Resources.Any(x => x.CreatorType == CreatorType.System);
        if (useDefaultResources is null || useDefaultResources == hasDefaultResources)
        {
            return;
        }

        var defaultTypes = await dbContext.Resources
            .Where(x => x.CreatorType == CreatorType.System)
            .ToListAsync(cancellationToken);
        user.SetDefaultResources(useDefaultResources.Value, defaultTypes);
    }
}
using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Users.Shared;
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
    ILogger<UpdateUserHandler> logger)
{
    /// <summary>
    /// Updates the current user's settings.
    /// </summary>
    /// <param name="request">The changes.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated settings.</returns>
    public async Task<Result<UserResponse>> UpdateAsync(UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .Include(x => x.Resources)
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

        if (request.AnalyticsConsent is not null)
        {
            userEntity.UpdateAnalyticsConsent(request.AnalyticsConsent.Value, timeProvider.GetUtcNow().UtcDateTime);
        }

        if (request.AiEnabled is not null)
        {
            userEntity.SetAiEnabled(request.AiEnabled.Value);
        }

        if (request.SensitiveDataConsent is not null)
        {
            userEntity.SetSensitiveDataConsent(request.SensitiveDataConsent.Value, timeProvider.GetUtcNow().UtcDateTime);
        }

        if (request.UseExternalProfile is not null)
        {
            await identityProvider.SetUseProfileInKijkAsync(currentUser.AuthId, request.UseExternalProfile.Value, cancellationToken);
        }

        await SetDefaultResourcesAsync(userEntity, request.UseDefaultResources, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return userEntity.ToResponse(userEntity.Resources.Any(resource => resource.CreatorType == CreatorType.System));
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
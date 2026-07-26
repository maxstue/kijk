using Kijk.Application.Abstractions.Persistence;
using Kijk.Application.Users.Shared;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.Update;

/// <summary>
/// Handler for updating a user.
/// </summary>
public class UpdateUserHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    ILogger<UpdateUserHandler> logger) : IHandler
{
    public async Task<Result<UserResponse>> UpdateAsync(UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .Include(x => x.Resources)
            .Include(x => x.UserHouseholds)
            .ThenInclude(x => x.Household)
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

        if (request.HouseholdName is not null)
        {
            var activeHousehold = userEntity.UserHouseholds.SingleOrDefault(x => x.IsActive)?.Household;
            if (activeHousehold is null)
            {
                logger.LogWarning("Active household for user with id '{Id}' not found", currentUser.Id);
                return Error.NotFound("Active household not found");
            }

            activeHousehold.Rename(request.HouseholdName.Trim());
        }

        if (request.AnalyticsConsent is not null)
        {
            userEntity.UpdateAnalyticsConsent(request.AnalyticsConsent.Value, timeProvider.GetUtcNow().UtcDateTime);
        }

        var hasDefaultResources = userEntity.Resources.Any(x => x.CreatorType == CreatorType.System);

        if (request.UseDefaultResources is true && !hasDefaultResources)
        {
            var defaultTypes = await dbContext.Resources
                .Where(x => x.CreatorType == CreatorType.System)
                .ToListAsync(cancellationToken);
            userEntity.SetDefaultResources(true, defaultTypes);
        }
        else if (request.UseDefaultResources is false && hasDefaultResources)
        {
            var defaultTypes = await dbContext.Resources
                .Where(x => x.CreatorType == CreatorType.System)
                .ToListAsync(cancellationToken);
            userEntity.SetDefaultResources(false, defaultTypes);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return userEntity.ToResponse(userEntity.Resources.Any(resource => resource.CreatorType == CreatorType.System));
    }
}
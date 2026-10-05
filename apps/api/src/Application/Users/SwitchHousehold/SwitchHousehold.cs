using Kijk.Application.Shared.Persistence;
using Kijk.Application.Users.GetMe;
using Kijk.Shared;

namespace Kijk.Application.Users.SwitchHousehold;

/// <summary>
/// Request for switching the active space of the current user.
/// </summary>
/// <param name="HouseholdId">The space to switch to; the user must be a member.</param>
public sealed record SwitchHouseholdRequest(Guid HouseholdId);

/// <summary>
/// Switches the current user's active space, e.g. between their personal space and a shared one. All other requests
/// work on the active space.
/// </summary>
public sealed class SwitchHouseholdHandler(IAppDbContext dbContext, CurrentUser currentUser, GetMeUserHandler getMeUserHandler) : IHandler
{
    /// <summary>Makes a membership the active one.</summary>
    /// <param name="request">The space to switch to.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated account, or a not-found error when the user is not a member.</returns>
    public async Task<Result<CurrentUserResponse>> SwitchAsync(SwitchHouseholdRequest request, CancellationToken cancellationToken)
    {
        var memberships = await dbContext.UserHouseholds
            .Where(link => link.UserId == currentUser.Id)
            .ToListAsync(cancellationToken);
        if (memberships.TrueForAll(link => link.HouseholdId != request.HouseholdId))
        {
            return Error.NotFound("Household could not be found");
        }

        foreach (var membership in memberships)
        {
            membership.SetActive(membership.HouseholdId == request.HouseholdId);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await getMeUserHandler.GetMeAsync(cancellationToken);
    }
}
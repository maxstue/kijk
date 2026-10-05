using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Households.Delete;

/// <summary>
/// Deletes a household and its household-owned data.
/// </summary>
public sealed class DeleteHouseholdHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>
    /// Deletes a household when the current user's role allows deleting it.
    /// Users who lose their last household are returned to onboarding.
    /// </summary>
    /// <param name="id">The household identifier.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>Whether the household was deleted.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .Include(item => item.UserHouseholds)
                .ThenInclude(link => link.User)
            .Include(item => item.UserHouseholds)
                .ThenInclude(link => link.Role.Permissions)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        var currentMembership = household?.UserHouseholds.SingleOrDefault(link => link.UserId == currentUser.Id);
        if (household is null || currentMembership is null)
        {
            return Error.NotFound("Household could not be found");
        }

        if (household.IsPersonal)
        {
            return Error.Conflict("A personal space cannot be deleted");
        }

        if (!currentMembership.Role.HasPermission(HouseholdPermissions.Household.Delete))
        {
            return Error.Authorization("Your household role does not allow deleting the household");
        }

        var memberUserIds = household.UserHouseholds.Select(link => link.UserId).ToArray();
        var otherMemberships = await dbContext.UserHouseholds
            .Where(link => memberUserIds.Contains(link.UserId) && link.HouseholdId != id)
            .ToListAsync(cancellationToken);

        foreach (var membership in household.UserHouseholds)
        {
            var remainingMemberships = otherMemberships.Where(link => link.UserId == membership.UserId).ToList();
            if (remainingMemberships.Count == 0)
            {
                membership.User.ResetOnboarding();
                continue;
            }

            if (membership.IsActive || remainingMemberships.All(link => !link.IsActive))
            {
                foreach (var remainingMembership in remainingMemberships)
                {
                    remainingMembership.SetActive(false);
                }

                remainingMemberships[0].SetActive(true);
            }
        }

        // Remove dependents that restrict resource deletion before household-owned resources cascade away.
        var consumptions = await dbContext.Consumptions
            .Where(item => item.HouseholdId == id)
            .ToListAsync(cancellationToken);
        var consumptionLimits = await dbContext.ConsumptionsLimits
            .Where(item => item.HouseholdId == id)
            .ToListAsync(cancellationToken);
        dbContext.Consumptions.RemoveRange(consumptions);
        dbContext.ConsumptionsLimits.RemoveRange(consumptionLimits);
        dbContext.Households.Remove(household);

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
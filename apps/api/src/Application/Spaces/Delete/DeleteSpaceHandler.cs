using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Spaces.Delete;

/// <summary>
/// Deletes a space and its space-owned data.
/// </summary>
public sealed class DeleteSpaceHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>
    /// Deletes a space when the current user's role allows deleting it.
    /// Users who lose their last space are returned to onboarding.
    /// </summary>
    /// <param name="id">The space identifier.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>Whether the space was deleted.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var space = await dbContext.Spaces
            .Include(item => item.UserSpaces)
                .ThenInclude(link => link.User)
            .Include(item => item.UserSpaces)
                .ThenInclude(link => link.Role.Permissions)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        var currentMembership = space?.UserSpaces.SingleOrDefault(link => link.UserId == currentUser.Id);
        if (space is null || currentMembership is null)
        {
            return Error.NotFound("Space could not be found");
        }

        if (space.IsPersonal)
        {
            return Error.Conflict("A personal space cannot be deleted");
        }

        if (!currentMembership.Role.HasPermission(SpacePermissions.Space.Delete))
        {
            return Error.Authorization("Your space role does not allow deleting the space");
        }

        var memberUserIds = space.UserSpaces.Select(link => link.UserId).ToArray();
        var otherMemberships = await dbContext.UserSpaces
            .Where(link => memberUserIds.Contains(link.UserId) && link.SpaceId != id)
            .ToListAsync(cancellationToken);

        foreach (var membership in space.UserSpaces)
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

        // Remove dependents that restrict resource deletion before space-owned resources cascade away.
        var consumptions = await dbContext.Consumptions
            .Where(item => item.SpaceId == id)
            .ToListAsync(cancellationToken);
        var limits = await dbContext.Limits
            .Where(item => item.SpaceId == id)
            .ToListAsync(cancellationToken);
        dbContext.Consumptions.RemoveRange(consumptions);
        dbContext.Limits.RemoveRange(limits);
        dbContext.Spaces.Remove(space);

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
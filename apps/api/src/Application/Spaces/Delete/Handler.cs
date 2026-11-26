using Kijk.Application.Shared.Jobs;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Spaces.Delete;

/// <summary>
/// Deletes a space and its space-owned data.
/// </summary>
public sealed class DeleteHandler(IAppDbContext dbContext, CurrentUser currentUser, IJobQueue queue)
{
    /// <summary>
    /// Deletes a space when the current user's role allows deleting it.
    /// Users who lose their last space are returned to onboarding.
    /// </summary>
    /// <param name="id">The space identifier.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>Whether the space was deleted.</returns>
    public async Task<Result<bool>> HandleAsync(Guid id, CancellationToken cancellationToken)
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

        // Members without another space return to onboarding.
        var memberUserIds = space.UserSpaces.Select(link => link.UserId).ToArray();
        var usersWithOtherSpaces = await dbContext.UserSpaces
            .Where(link => memberUserIds.Contains(link.UserId) && link.SpaceId != id)
            .Select(link => link.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var membership in space.UserSpaces.Where(link => !usersWithOtherSpaces.Contains(link.UserId)))
        {
            membership.User.ResetOnboarding();
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var providerIds = await dbContext.SpaceInvitations.Where(item => item.SpaceId == id)
            .RemoveForErasureAsync(dbContext, cancellationToken);
        await SpaceDataEraser.EraseAsync(dbContext, id, cancellationToken);
        if (providerIds.Length > 0)
        {
            await queue.SaveChangesAndEnqueueAsync(new DeleteProviderInvitations(providerIds), cancellationToken);
        }
        else
        {
            await transaction.CommitAsync(cancellationToken);
        }

        return true;
    }
}
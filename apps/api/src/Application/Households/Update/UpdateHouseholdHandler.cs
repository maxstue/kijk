using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Households.Update;

/// <summary>
/// Updates the details of a household managed by the current user.
/// </summary>
public sealed class UpdateHouseholdHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>
    /// Updates a household when the current user's role allows configuring it.
    /// </summary>
    /// <param name="id">The household identifier.</param>
    /// <param name="request">The updated household details.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>Whether the household was updated.</returns>
    public async Task<Result<bool>> UpdateAsync(Guid id, UpdateHouseholdRequest request, CancellationToken cancellationToken)
    {
        var membership = await dbContext.UserHouseholds
            .Include(link => link.Household)
            .Include(link => link.Role.Permissions)
            .FirstOrDefaultAsync(link => link.UserId == currentUser.Id && link.HouseholdId == id, cancellationToken);

        if (membership is null)
        {
            return Error.NotFound("Household could not be found");
        }

        if (!membership.Role.HasPermission(HouseholdPermissions.Household.Configure))
        {
            return Error.Authorization("Your household role does not allow changing household details");
        }

        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        membership.Household.UpdateDetails(request.Name.Trim(), description);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
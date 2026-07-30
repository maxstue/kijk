using Kijk.Application.Resources.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Resources.Create;

/// <summary>
/// Handler to create a new resource.
/// </summary>
public class CreateResourceHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<CreateResourceHandler> logger) : IHandler
{
    public async Task<Result<ResourceResponse>> CreateAsync(CreateResourceRequest request, CancellationToken cancellationToken)
    {
        if (!await dbContext.IsActiveHouseholdAdminAsync(currentUser, cancellationToken))
        {
            logger.LogWarning("User with id '{UserId}' is not allowed to manage resources in household '{HouseholdId}'",
                currentUser.Id, currentUser.ActiveHouseholdId);
            return Error.Authorization("Only the active household administrator can manage resources");
        }

        var household = await dbContext.Households
            .FirstOrDefaultAsync(household => household.Id == currentUser.ActiveHouseholdId, cancellationToken);
        if (household is null)
        {
            logger.LogWarning("Active household with id '{HouseholdId}' was not found", currentUser.ActiveHouseholdId);
            return Error.NotFound("Active household was not found");
        }

        var name = request.Name.Trim();
        var unit = request.Unit.Trim();
        if (await dbContext.HasResourceConflictAsync(currentUser, name, unit, null, cancellationToken))
        {
            logger.LogWarning("Resource with name '{Name}' and unit '{Unit}' already exists", name, unit);
            return Error.Conflict($"A resource with the name '{name}' and unit '{unit}' already exists");
        }

        var newResource = new Resource
        {
            Name = name,
            Unit = unit,
            Color = request.Color,
            CreatorType = CreatorType.User,
            Household = household
        };

        var resEntity = await dbContext.Resources.AddAsync(newResource, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return resEntity.Entity.ToResponse();
    }
}
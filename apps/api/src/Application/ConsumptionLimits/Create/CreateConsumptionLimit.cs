using Kijk.Application.ConsumptionLimits.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.ConsumptionLimits.Create;

/// <summary>
/// Creates consumption limits for the active household.
/// </summary>
public sealed class CreateConsumptionLimitHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    ILogger<CreateConsumptionLimitHandler> logger) : IHandler
{
    public async Task<Result<ConsumptionLimitResponse>> CreateAsync(CreateConsumptionLimitRequest request, CancellationToken cancellationToken)
    {
        var household = await dbContext.Households
            .FirstOrDefaultAsync(item => item.Id == currentUser.ActiveHouseholdId, cancellationToken);
        var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Id == currentUser.Id, cancellationToken);
        if (household is null || user is null)
        {
            logger.LogWarning("Active household or user could not be resolved for user {UserId}", currentUser.Id);
            return Error.NotFound("Active household could not be found");
        }

        var resource = await dbContext.GetUserAvailableResources(currentUser)
            .FirstOrDefaultAsync(item => item.Id == request.ResourceId, cancellationToken);
        if (resource is null)
        {
            return Error.NotFound("Resource is not available in the active household");
        }

        var exists = await dbContext.ConsumptionsLimits.AnyAsync(
            item => item.HouseholdId == household.Id && item.ResourceId == resource.Id && item.Period == request.Period,
            cancellationToken);
        if (exists)
        {
            return Error.Conflict("A consumption limit already exists for this resource and period");
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var limit = ConsumptionLimit.Create(
            new ConsumptionLimitSettings(
                request.Name.Trim(),
                request.Description?.Trim(),
                request.Limit,
                request.Period,
                request.Active),
            resource, user, household, utcNow);

        dbContext.ConsumptionsLimits.Add(limit);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var duplicateExists = await dbContext.ConsumptionsLimits
                .AsNoTracking()
                .AnyAsync(
                    item => item.HouseholdId == household.Id
                            && item.ResourceId == resource.Id
                            && item.Period == request.Period,
                    cancellationToken);
            if (!duplicateExists)
            {
                throw;
            }

            return Error.Conflict("A consumption limit already exists for this resource and period");
        }

        var (start, end) = ConsumptionLimitEvaluation.GetPeriodRange(limit.Period, utcNow);
        var consumptions = await dbContext.Consumptions
            .Where(item => item.HouseholdId == household.Id
                           && item.ResourceId == resource.Id
                           && item.Date.Value >= start
                           && item.Date.Value < end)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return ConsumptionLimitEvaluation.ToResponse(limit, consumptions, utcNow);
    }
}
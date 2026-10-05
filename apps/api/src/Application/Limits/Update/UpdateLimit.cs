using Kijk.Application.Limits.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Limits.Update;

/// <summary>
/// Updates consumption limits owned by the active household.
/// </summary>
public sealed class UpdateLimitHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    /// <summary>Updates a limit of the active household.</summary>
    /// <param name="id">The limit id.</param>
    /// <param name="request">The new limit data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated limit with its current evaluation.</returns>
    public async Task<Result<LimitResponse>> UpdateAsync(
        Guid id,
        UpdateLimitRequest request,
        CancellationToken cancellationToken)
    {
        var limit = await dbContext.Limits
            .Include(item => item.Resource)
            .ThenInclude(resource => resource.Unit)
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (limit is null)
        {
            return Error.NotFound("Consumption limit could not be found");
        }

        var conflict = await dbContext.Limits.AnyAsync(
            item => item.Id != id
                    && item.HouseholdId == currentUser.ActiveHouseholdId
                    && item.ResourceId == limit.ResourceId
                    && item.Period == request.Period,
            cancellationToken);
        if (conflict)
        {
            return Error.Conflict("A consumption limit already exists for this resource and period");
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var yearStart = new DateTime(utcNow.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var yearEnd = yearStart.AddYears(1);
        var consumptions = await dbContext.Consumptions
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId
                           && item.ResourceId == limit.ResourceId
                           && item.Date >= yearStart && item.Date < yearEnd)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var wasReached = limit.Active && limit.Period == request.Period
                         && LimitEvaluation.ToResponse(limit, consumptions, utcNow).IsExceeded;

        limit.Update(request.Name.Trim(), request.Description?.Trim(), request.Limit, request.Period, request.Active);
        limit.RecordOccurrence(wasReached, LimitEvaluation.ToResponse(limit, consumptions, utcNow).IsExceeded, utcNow);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var duplicateExists = await dbContext.Limits
                .AsNoTracking()
                .AnyAsync(
                    item => item.Id != id
                            && item.HouseholdId == currentUser.ActiveHouseholdId
                            && item.ResourceId == limit.ResourceId
                            && item.Period == request.Period,
                    cancellationToken);
            if (!duplicateExists)
            {
                throw;
            }

            return Error.Conflict("A consumption limit already exists for this resource and period");
        }

        return LimitEvaluation.ToResponse(limit, consumptions, utcNow);
    }
}
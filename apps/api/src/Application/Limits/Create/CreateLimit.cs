using Kijk.Application.Limits.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Resources;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Limits.Create;

/// <summary>
/// Creates consumption limits for the active space.
/// </summary>
public sealed class CreateLimitHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    TimeProvider timeProvider,
    ILogger<CreateLimitHandler> logger) : IHandler
{
    /// <summary>Creates a consumption limit for the active space.</summary>
    /// <param name="request">The limit data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created limit with its current evaluation.</returns>
    public async Task<Result<LimitResponse>> CreateAsync(CreateLimitRequest request, CancellationToken cancellationToken)
    {
        var space = await dbContext.Spaces
            .FirstOrDefaultAsync(item => item.Id == currentUser.ActiveSpaceId, cancellationToken);
        var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Id == currentUser.Id, cancellationToken);
        if (space is null || user is null)
        {
            logger.LogWarning("Active space or user could not be resolved for user {UserId}", currentUser.Id);
            return Error.NotFound("Active space could not be found");
        }

        var resource = await dbContext.GetUserAvailableResources(currentUser)
            .Include(item => item.Unit)
            .FirstOrDefaultAsync(item => item.Id == request.ResourceId, cancellationToken);
        if (resource is null)
        {
            return Error.NotFound("Resource is not available in the active space");
        }

        var exists = await dbContext.Limits.AnyAsync(
            item => item.SpaceId == space.Id && item.ResourceId == resource.Id && item.Period == request.Period,
            cancellationToken);
        if (exists)
        {
            return Error.Conflict("A consumption limit already exists for this resource and period");
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var limit = Limit.Create(
            new LimitSettings(
                request.Name.Trim(),
                request.Description?.Trim(),
                request.Limit,
                request.Period,
                request.Active),
            resource, user, space);

        var (start, end) = LimitEvaluation.GetPeriodRange(limit.Period, utcNow);
        var consumptions = await dbContext.Consumptions
            .Where(item => item.SpaceId == space.Id
                           && item.ResourceId == resource.Id
                           && item.Date >= start
                           && item.Date < end)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        limit.RecordOccurrence(false, consumptions.Sum(item => item.Value) >= limit.Threshold, utcNow);

        dbContext.Limits.Add(limit);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var duplicateExists = await dbContext.Limits
                .AsNoTracking()
                .AnyAsync(
                    item => item.SpaceId == space.Id
                            && item.ResourceId == resource.Id
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
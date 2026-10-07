using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Units.Shared;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.Create;

/// <summary>
/// Creates user-owned units and optional space shares.
/// </summary>
public sealed class CreateUnitHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    /// <summary>
    /// Creates a unit owned by the current user and optionally shares it with spaces; sharing requires the
    /// units:share permission in each space.
    /// </summary>
    /// <param name="request">The unit data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The created unit.</returns>
    public async Task<Result<UnitResponse>> CreateAsync(CreateUnitRequest request, CancellationToken cancellationToken)
    {
        var reference = await dbContext.Units
            .FirstOrDefaultAsync(unit => unit.Id == request.ReferenceUnitId
                                         && unit.CreatorType == CreatorType.System
                                         && unit.ConversionType == UnitConversionType.UnitsNet,
                cancellationToken);
        if (reference is null)
        {
            return Error.Validation("Reference unit must be a supported system unit");
        }

        var normalizedName = request.Name.Trim().ToLowerInvariant();
        if (await dbContext.Units.AnyAsync(
                unit => unit.OwnerUserId == currentUser.Id
                        && unit.ArchivedAt == null
                        && unit.Name.Trim().ToLower() == normalizedName,
                cancellationToken))
        {
            return Error.Conflict("A unit with this name already exists");
        }

        // Sharing while creating needs the same permission as the dedicated share endpoint.
        var spaceIds = (request.ShareWithSpaceIds ?? []).Distinct().ToList();
        foreach (var spaceId in spaceIds)
        {
            if (await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, SpacePermissions.Units.Share, cancellationToken) is { } error)
            {
                return error;
            }
        }

        var unit = new Unit
        {
            Name = request.Name.Trim(),
            Symbol = request.Symbol.Trim(),
            CreatorType = CreatorType.User,
            ConversionType = UnitConversionType.Factor,
            QuantityKey = reference.QuantityKey,
            ReferenceUnit = reference,
            ConversionFactor = request.ConversionFactor,
            OwnerUserId = currentUser.Id
        };
        var now = timeProvider.GetUtcNow().UtcDateTime;
        foreach (var spaceId in spaceIds)
        {
            unit.Spaces.Add(new UnitSpace
            {
                Unit = unit,
                SpaceId = spaceId,
                Space = null!,
                SharedByUserId = currentUser.Id,
                SharedByUser = null!,
                SharedAt = now
            });
        }

        dbContext.Units.Add(unit);
        await dbContext.SaveChangesAsync(cancellationToken);
        return UnitResponseFactory.Create(unit, currentUser, 0);
    }
}
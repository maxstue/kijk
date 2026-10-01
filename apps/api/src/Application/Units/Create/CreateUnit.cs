using Kijk.Application.Shared.Persistence;
using Kijk.Application.Units.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.Create;

/// <summary>
/// Creates user-owned units and optional household shares.
/// </summary>
public sealed class CreateUnitHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) : IHandler
{
    /// <summary>Creates a unit owned by the current user and optionally shares it with households.</summary>
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

        var householdIds = (request.ShareWithHouseholdIds ?? []).Distinct().ToList();
        var allowedHouseholdIds = await dbContext.UserHouseholds
            .Where(link => link.UserId == currentUser.Id && householdIds.Contains(link.HouseholdId))
            .Select(link => link.HouseholdId)
            .ToListAsync(cancellationToken);
        if (allowedHouseholdIds.Count != householdIds.Count)
        {
            return Error.Authorization("A unit can only be shared with households of the current user");
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
        foreach (var householdId in householdIds)
        {
            unit.Households.Add(new UnitHousehold
            {
                Unit = unit,
                HouseholdId = householdId,
                Household = null!,
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
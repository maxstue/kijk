using Kijk.Application.Shared.Persistence;
using Kijk.Application.Units.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.Update;

/// <summary>
/// Updates user-owned unit metadata.
/// </summary>
public sealed class UpdateUnitHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    public async Task<Result<UnitResponse>> UpdateAsync(Guid id, UpdateUnitRequest request, CancellationToken cancellationToken)
    {
        var unit = await dbContext.Units.Include(item => item.Households)
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == currentUser.Id, cancellationToken);
        if (unit is null)
        {
            return Error.NotFound("Unit could not be found");
        }

        var reference = await dbContext.Units.FirstOrDefaultAsync(item =>
            item.Id == request.ReferenceUnitId
            && item.CreatorType == CreatorType.System
            && item.ConversionType == UnitConversionType.UnitsNet, cancellationToken);
        if (reference is null)
        {
            return Error.Validation("Reference unit must be a supported system unit");
        }

        var normalizedName = request.Name.Trim().ToLowerInvariant();
        if (await dbContext.Units.AnyAsync(item => item.Id != id && item.OwnerUserId == currentUser.Id
                                                   && item.ArchivedAt == null
                                                   && item.Name.Trim().ToLower() == normalizedName, cancellationToken))
        {
            return Error.Conflict("A unit with this name already exists");
        }

        unit.Name = request.Name.Trim();
        unit.Symbol = request.Symbol.Trim();
        unit.ReferenceUnit = reference;
        unit.ConversionFactor = request.ConversionFactor;
        unit.QuantityKey = reference.QuantityKey;
        unit.ConversionType = UnitConversionType.Factor;
        await dbContext.SaveChangesAsync(cancellationToken);
        var count = await dbContext.Resources.CountAsync(resource => resource.UnitId == unit.Id, cancellationToken);
        return UnitResponseFactory.Create(unit, currentUser, count);
    }
}
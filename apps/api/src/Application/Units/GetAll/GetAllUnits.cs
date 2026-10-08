using Kijk.Application.Shared.Persistence;
using Kijk.Application.Units.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.GetAll;

/// <summary>
/// Lists system, personal, and active-household units visible to the current user.
/// </summary>
public sealed class GetAllUnitsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Gets the system units.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The system units.</returns>
    public async Task<Result<List<UnitResponse>>> GetSystemAsync(CancellationToken cancellationToken)
    {
        var units = await dbContext.Units.Where(unit => unit.CreatorType == CreatorType.System
                                                        && unit.ConversionType == UnitConversionType.UnitsNet)
            .OrderBy(unit => unit.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        return units.Select(unit => UnitResponseFactory.Create(unit, currentUser, 0)).ToList();
    }

    /// <summary>Gets a page of the user's personal units or of the units available in a household.</summary>
    /// <param name="household">Whether to list household units instead of personal units.</param>
    /// <param name="householdId">The household; defaults to the active household.</param>
    /// <param name="page">The 1-based page number.</param>
    /// <param name="pageSize">The page size (1-100).</param>
    /// <param name="search">An optional name or symbol filter.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The page.</returns>
    public async Task<Result<UnitPageResponse>> GetPageAsync(
        bool household, Guid? householdId, int page, int pageSize, string? search, CancellationToken cancellationToken)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Clamp(page, 1, int.MaxValue / pageSize);
        var selectedHouseholdId = householdId ?? currentUser.ActiveHouseholdId;
        if (household && (selectedHouseholdId is null || !await dbContext.UserHouseholds.AnyAsync(
                link => link.UserId == currentUser.Id && link.HouseholdId == selectedHouseholdId,
                cancellationToken)))
        {
            return Error.Authorization("The selected household is not available to the current user");
        }

        var query = dbContext.Units
            .Where(unit => unit.CreatorType == CreatorType.System
                           || (household
                               ? unit.Households.Any(link => link.HouseholdId == selectedHouseholdId)
                               : unit.OwnerUserId == currentUser.Id));
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(unit => unit.Name.ToLower().Contains(term) || unit.Symbol.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var customCount = await query.CountAsync(unit => unit.CreatorType == CreatorType.User, cancellationToken);
        var units = await query.Include(unit => unit.Households)
            .OrderBy(unit => unit.Name)
            .ThenBy(unit => unit.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var ids = units.Select(unit => unit.Id).ToList();
        var counts = await dbContext.Resources.Where(resource => ids.Contains(resource.UnitId))
            .GroupBy(resource => resource.UnitId)
            .Select(group => new { UnitId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.UnitId, item => item.Count, cancellationToken);
        var items = units.Select(unit => UnitResponseFactory.Create(unit, currentUser, counts.GetValueOrDefault(unit.Id), selectedHouseholdId)).ToList();
        return new UnitPageResponse(items, totalCount, customCount, page, pageSize);
    }

    /// <summary>Gets all units visible to the current user.</summary>
    /// <param name="includeArchived">Whether to include archived units.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The units.</returns>
    public async Task<Result<List<UnitResponse>>> GetAllAsync(bool includeArchived, CancellationToken cancellationToken)
    {
        var units = await dbContext.GetVisibleUnits(currentUser)
            .Include(unit => unit.Households)
            .Where(unit => includeArchived || unit.ArchivedAt == null)
            .OrderBy(unit => unit.CreatorType)
            .ThenBy(unit => unit.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var ids = units.Select(unit => unit.Id).ToList();
        var counts = await dbContext.Resources
            .Where(resource => ids.Contains(resource.UnitId))
            .GroupBy(resource => resource.UnitId)
            .Select(group => new { UnitId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.UnitId, item => item.Count, cancellationToken);

        return units.Select(unit => UnitResponseFactory.Create(unit, currentUser, counts.GetValueOrDefault(unit.Id))).ToList();
    }
}
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Units.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Units.List;

/// <summary>
/// Lists the system, personal, or space units available to the current user.
/// </summary>
public sealed class ListHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    private const int MaximumPageSize = 100;

    /// <summary>Gets the units of a scope, optionally filtered and paged.</summary>
    /// <param name="request">The scope, filters, and page.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The units, or an authorization error for a space the user is not a member of.</returns>
    public async Task<Result<UnitPageResponse>> HandleAsync(GetUnitsRequest request, CancellationToken cancellationToken)
    {
        var selectedSpaceId = request.SpaceId;
        if (request.Scope == UnitScope.Space && selectedSpaceId is null)
        {
            return Error.Validation("The space scope needs a space id");
        }

        if (request.Scope == UnitScope.Space && !await dbContext.UserSpaces.AnyAsync(
                link => link.UserId == currentUser.Id && link.SpaceId == selectedSpaceId,
                cancellationToken))
        {
            return Error.Authorization("The selected space is not available to the current user");
        }

        var query = request.Scope switch
        {
            UnitScope.Space => dbContext.Units.Where(unit => unit.CreatorType == CreatorType.System
                                                             || unit.Spaces.Any(link => link.SpaceId == selectedSpaceId)),
            UnitScope.Personal => dbContext.Units.Where(unit => unit.CreatorType == CreatorType.System
                                                                || unit.OwnerUserId == currentUser.Id),
            _ => dbContext.Units.Where(unit => unit.CreatorType == CreatorType.System)
        };
        if (!request.IncludeArchived)
        {
            query = query.Where(unit => unit.ArchivedAt == null);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim()
                .Replace("\\", "\\\\", StringComparison.Ordinal)
                .Replace("%", "\\%", StringComparison.Ordinal)
                .Replace("_", "\\_", StringComparison.Ordinal);
            var pattern = $"%{term}%";
            query = query.Where(unit => EF.Functions.ILike(unit.Name, pattern, "\\")
                                       || EF.Functions.ILike(unit.Symbol, pattern, "\\"));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var customCount = await query.CountAsync(unit => unit.CreatorType == CreatorType.User, cancellationToken);
        var ordered = query.Include(unit => unit.Spaces)
            .OrderBy(unit => unit.Name)
            .ThenBy(unit => unit.Id);
        var pageSize = request.PageSize is { } size ? Math.Clamp(size, 1, MaximumPageSize) : Math.Max(totalCount, 1);
        var page = Math.Clamp(request.Page ?? 1, 1, int.MaxValue / pageSize);
        var units = await ordered.Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var ids = units.Select(unit => unit.Id).ToList();
        var counts = await dbContext.Resources.Where(resource => ids.Contains(resource.UnitId))
            .GroupBy(resource => resource.UnitId)
            .Select(group => new { UnitId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.UnitId, item => item.Count, cancellationToken);
        var items = units.Select(unit => UnitResponseFactory.Create(unit, currentUser, counts.GetValueOrDefault(unit.Id), selectedSpaceId)).ToList();
        return new UnitPageResponse(items, totalCount, customCount, page, pageSize);
    }
}
using Kijk.Application.CategoryRules.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.CategoryRules.Get;

/// <summary>
/// Retrieves the remembered category corrections of the active space.
/// </summary>
public sealed class GetCategoryRulesHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Gets all rules, ordered by label.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The rules.</returns>
    public async Task<Result<List<CategoryRuleResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var rules = await dbContext.GetVisibleRules(currentUser)
            .Include(item => item.Category)
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId)
            .OrderBy(item => item.Label)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return rules.Select(rule => rule.ToResponse()).ToList();
    }
}
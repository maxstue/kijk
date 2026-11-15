using Kijk.Application.CategoryRules.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Paging;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.CategoryRules.List;

/// <summary>
/// Retrieves the remembered category corrections of the active space.
/// </summary>
public sealed class ListHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>Gets the rules whose label or category name contains the search, ordered by label unless another sort is requested.</summary>
    /// <param name="request">The optional search, sort and page.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The rules.</returns>
    public async Task<Result<PageResponse<CategoryRuleResponse>>> HandleAsync(ListRequest<CategoryRuleSort> request, CancellationToken cancellationToken)
    {
        var query = dbContext.GetVisibleRules(currentUser)
            .Include(rule => rule.Category)
            .Where(rule => rule.SpaceId == currentUser.ActiveSpaceId)
            .AsNoTracking();
        if (request.Search.ToContainsPattern() is { } pattern)
        {
            // Category names use a case-insensitive collation, which supports LIKE but not ILIKE.
            query = query.Where(rule => EF.Functions.ILike(rule.Label, pattern, PagingExtensions.LikeEscape)
                                        || EF.Functions.Like(rule.Category!.Name, pattern, PagingExtensions.LikeEscape));
        }

        var ordered = request.Sort == CategoryRuleSort.Category
            ? query.OrderBy(rule => rule.Category!.Name, request.Descending).ThenBy(rule => rule.Label)
            : query.OrderBy(rule => rule.Label, request.Descending);
        var page = await ordered.ThenBy(rule => rule.Id).ToPageAsync(request.Page, request.PageSize, cancellationToken);
        return page.Map(rule => rule.ToResponse());
    }
}
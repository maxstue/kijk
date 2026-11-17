using Kijk.Application.Categories.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Paging;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Categories.List;

/// <summary>
/// Retrieves the categories available to the active space.
/// </summary>
public sealed class ListHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>
    /// Gets the system categories and the active space's own categories whose name contains the search; expenses first,
    /// then by name, unless another sort is requested.
    /// </summary>
    /// <param name="request">The optional search, sort and page.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The categories.</returns>
    public async Task<Result<PageResponse<CategoryResponse>>> HandleAsync(ListRequest<CategorySort> request, CancellationToken cancellationToken)
    {
        var query = dbContext.GetAvailableCategories(currentUser).AsNoTracking();
        if (request.Search.ToContainsPattern() is { } pattern)
        {
            // Names use a case-insensitive collation, which supports LIKE but not ILIKE.
            query = query.Where(category => EF.Functions.Like(category.Name, pattern, PagingExtensions.LikeEscape));
        }

        var ordered = request.Sort switch
        {
            CategorySort.Name => query.OrderBy(category => category.Name, request.Descending),
            CategorySort.CreatorType => query.OrderBy(category => category.CreatorType, request.Descending).ThenBy(category => category.Name),
            _ => query.OrderBy(category => category.Kind, request.Descending).ThenBy(category => category.Name)
        };
        var page = await ordered.ThenBy(category => category.Id).ToPageAsync(request.Page, request.PageSize, cancellationToken);
        return page.Map(category => category.ToResponse());
    }
}
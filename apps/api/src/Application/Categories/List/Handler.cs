using Kijk.Application.Categories.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Categories.List;

/// <summary>
/// Retrieves the categories available to the active space.
/// </summary>
public sealed class ListHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>Gets the system categories and the active space's own categories.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The categories, expenses first and then by name.</returns>
    public async Task<Result<List<CategoryResponse>>> HandleAsync(CancellationToken cancellationToken)
    {
        var categories = await dbContext.GetAvailableCategories(currentUser)
            .OrderBy(category => category.Kind)
            .ThenBy(category => category.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return categories.Select(category => category.ToResponse()).ToList();
    }
}
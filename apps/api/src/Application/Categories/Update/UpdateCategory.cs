using Kijk.Application.Categories.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Categories.Update;

/// <summary>
/// Updates custom categories of the active space.
/// </summary>
public sealed class UpdateCategoryHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Updates a custom category of the active space.</summary>
    /// <param name="id">The category id.</param>
    /// <param name="request">The new category data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated category, or a not-found, authorization or conflict error.</returns>
    public async Task<Result<CategoryResponse>> UpdateAsync(Guid id, UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await dbContext.GetAvailableCategories(currentUser)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (category is null)
        {
            return Error.NotFound("Category could not be found");
        }

        if (category.CreatorType == CreatorType.System)
        {
            return Error.Authorization("System categories cannot be modified");
        }

        var name = request.Name.Trim();
        if (await CategoryHelpers.HasNameConflictAsync(dbContext.GetAvailableCategories(currentUser), name, id, cancellationToken))
        {
            return Error.Conflict($"A category with the name '{name}' already exists");
        }

        if (category.Kind != request.Kind && await dbContext.Budgets.AnyAsync(budget => budget.CategoryId == id, cancellationToken))
        {
            return Error.Conflict("The kind of a category with budgets cannot be changed");
        }

        category.Update(name, request.Icon, request.Color, request.Kind);
        await dbContext.SaveChangesAsync(cancellationToken);

        return category.ToResponse();
    }
}
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Categories.Delete;

/// <summary>
/// Deletes unused custom categories of the active space.
/// </summary>
public sealed class DeleteCategoryHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Deletes a custom category that no transaction or budget uses.</summary>
    /// <param name="id">The category id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found, authorization or conflict error.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var category = await dbContext.GetAvailableCategories(currentUser)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (category is null)
        {
            return Error.NotFound("Category could not be found");
        }

        if (category.CreatorType == CreatorType.System)
        {
            return Error.Authorization("System categories cannot be deleted");
        }

        var transactionCount = await dbContext.Transactions.CountAsync(item => item.CategoryId == id, cancellationToken);
        var budgetCount = await dbContext.Budgets.CountAsync(item => item.CategoryId == id, cancellationToken);
        if (transactionCount > 0 || budgetCount > 0)
        {
            return Error.Conflict(
                $"Category cannot be deleted because it is used by {transactionCount} transaction(s) and {budgetCount} budget(s)");
        }

        dbContext.Categories.Remove(category);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
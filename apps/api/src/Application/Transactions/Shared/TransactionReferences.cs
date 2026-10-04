using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Shared;

/// <summary>
/// Resolves and normalizes the values of transaction requests.
/// </summary>
internal static class TransactionReferences
{
    /// <summary>Loads the referenced account and category from the active household.</summary>
    /// <param name="dbContext">The application database context.</param>
    /// <param name="currentUser">The current authenticated user.</param>
    /// <param name="accountId">The account id, if any.</param>
    /// <param name="categoryId">The category id, if any.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns>The resolved references, or a not-found error.</returns>
    internal static async Task<Result<(Account? Account, Category? Category)>> ResolveAsync(
        IAppDbContext dbContext,
        CurrentUser currentUser,
        Guid? accountId,
        Guid? categoryId,
        CancellationToken cancellationToken)
    {
        Account? account = null;
        if (accountId is { } requestedAccountId)
        {
            account = await dbContext.GetHouseholdAccounts(currentUser)
                .FirstOrDefaultAsync(item => item.Id == requestedAccountId, cancellationToken);
            if (account is null)
            {
                return Error.NotFound("Account is not available in the active household");
            }
        }

        Category? category = null;
        if (categoryId is { } requestedCategoryId)
        {
            category = await dbContext.GetAvailableCategories(currentUser)
                .FirstOrDefaultAsync(item => item.Id == requestedCategoryId, cancellationToken);
            if (category is null)
            {
                return Error.NotFound("Category is not available in the active household");
            }
        }

        return (account, category);
    }

    /// <summary>Trims free text and turns blank values into <see langword="null" />.</summary>
    /// <param name="value">The text.</param>
    /// <returns>The normalized text.</returns>
    internal static string? NormalizeText(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
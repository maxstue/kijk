using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Categorize;

/// <summary>
/// Request for assigning one category to several transactions, e.g. from the list of uncategorized transactions.
/// </summary>
/// <param name="Ids">The transactions.</param>
/// <param name="CategoryId">The category, or <see langword="null" /> to mark them as uncategorized.</param>
public sealed record CategorizeTransactionsRequest(List<Guid> Ids, Guid? CategoryId);

/// <summary>
/// Validates the request for assigning a category to several transactions.
/// </summary>
public sealed class CategorizeTransactionsValidator : AbstractValidator<CategorizeTransactionsRequest>
{
    /// <summary>The maximum number of transactions per request.</summary>
    public const int MaximumCount = 500;

    /// <summary>Creates the validator rules.</summary>
    public CategorizeTransactionsValidator() =>
        RuleFor(request => request.Ids)
            .NotEmpty()
            .Must(ids => ids.Count <= MaximumCount)
            .WithMessage($"At most {MaximumCount} transactions can be changed at once")
            .WithErrorCode(ErrorCodes.ValidationError);
}

/// <summary>The result of assigning a category to several transactions.</summary>
/// <param name="Updated">The number of changed transactions.</param>
public sealed record CategorizeTransactionsResponse(int Updated);

/// <summary>
/// Assigns one category to several transactions of the active household. The category counts as set by hand, so
/// automatic categorization never overrides it.
/// </summary>
public sealed class CategorizeTransactionsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Assigns the category.</summary>
    /// <param name="request">The transactions and the category.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The number of changed transactions, or a not-found error.</returns>
    public async Task<Result<CategorizeTransactionsResponse>> CategorizeAsync(CategorizeTransactionsRequest request, CancellationToken cancellationToken)
    {
        Category? category = null;
        if (request.CategoryId is { } categoryId)
        {
            category = await dbContext.GetAvailableCategories(currentUser).FirstOrDefaultAsync(item => item.Id == categoryId, cancellationToken);
            if (category is null)
            {
                return Error.NotFound("Category is not available in the active household");
            }
        }

        var ids = request.Ids.Distinct().ToList();
        var transactions = await dbContext.GetVisibleTransactions(currentUser)
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId && ids.Contains(item.Id))
            .ToListAsync(cancellationToken);
        if (transactions.Count != ids.Count)
        {
            return Error.NotFound("Some transactions could not be found");
        }

        foreach (var transaction in transactions)
        {
            transaction.AssignCategoryManually(category);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return new CategorizeTransactionsResponse(transactions.Count);
    }
}
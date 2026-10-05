using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Transactions.Shared;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Categorize;

/// <summary>
/// Request for correcting the category of a transaction.
/// </summary>
/// <param name="CategoryId">The category, or <see langword="null" /> to mark the transaction as uncategorized.</param>
/// <param name="Remember">
/// <see langword="false" /> corrects only this transaction. <see langword="true" /> also remembers the category for this
/// merchant or counterparty, applies it to its other automatically categorized transactions and to future imports.
/// </param>
/// <param name="Keyword">
/// With <paramref name="Remember" />: remembers the category for all bookings whose purpose contains this word
/// (one of <see cref="TransactionResponse.RememberKeywords" />) instead of for the merchant or counterparty.
/// </param>
public sealed record CategorizeTransactionRequest(Guid? CategoryId, bool Remember, string? Keyword = null);

/// <summary>The corrected transaction.</summary>
/// <param name="Transaction">The transaction.</param>
/// <param name="AppliedToOthers">The number of other transactions that got the remembered category.</param>
public sealed record CategorizeTransactionResponse(TransactionResponse Transaction, int AppliedToOthers);

/// <summary>
/// Corrects the category of a transaction, optionally remembering it as a rule. Manual categories of other
/// transactions are never changed.
/// </summary>
public sealed class CategorizeTransactionHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Corrects a category.</summary>
    /// <param name="id">The transaction id.</param>
    /// <param name="request">The correction.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The transaction, or a not-found or validation error.</returns>
    public async Task<Result<CategorizeTransactionResponse>> CategorizeAsync(
        Guid id,
        CategorizeTransactionRequest request,
        CancellationToken cancellationToken)
    {
        var transaction = await dbContext.GetVisibleTransactions(currentUser)
            .Include(item => item.Account)
            .Include(item => item.Category)
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (transaction is null)
        {
            return Error.NotFound("Transaction could not be found");
        }

        Category? category = null;
        if (request.CategoryId is { } categoryId)
        {
            category = await dbContext.GetAvailableCategories(currentUser).FirstOrDefaultAsync(item => item.Id == categoryId, cancellationToken);
            if (category is null)
            {
                return Error.NotFound("Category is not available in the active space");
            }
        }

        transaction.AssignCategoryManually(category);
        var applied = 0;
        if (request.Remember)
        {
            if (category is null)
            {
                return Error.Validation("Only a category can be remembered");
            }

            if (ResolveRule(transaction, request.Keyword) is not { } rule)
            {
                return Error.Validation(request.Keyword is null
                    ? "Only bookings with a counterparty IBAN, card payments and direct debits can be remembered; choose a keyword instead"
                    : "The keyword must be a word of the transaction's purpose");
            }

            // A keyword rule is labelled with its keyword only, so it holds nothing about the counterparty.
            var label = rule.Scope == CategoryRuleScope.Keyword ? rule.Key : transaction.Counterparty ?? string.Empty;
            await RememberAsync(rule.Scope, rule.Key, label, category, cancellationToken);
            applied = await ApplyToOthersAsync(transaction, rule.Scope, rule.Key, category, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return new CategorizeTransactionResponse(transaction.ToResponse(), applied);
    }

    private static (CategoryRuleScope Scope, string Key)? ResolveRule(Transaction transaction, string? keyword)
    {
        if (keyword is null)
        {
            return CategoryRuleKeys.For(transaction.CounterpartyKey, transaction.Counterparty, transaction.IsMerchantPayment);
        }

        var normalized = PurposeKeywords.Normalize(keyword);
        return normalized is not null && PurposeKeywords.Contains(transaction.Purpose, normalized)
            ? (CategoryRuleScope.Keyword, normalized)
            : null;
    }

    private async Task RememberAsync(CategoryRuleScope scope, string key, string label, Category category, CancellationToken cancellationToken)
    {
        var spaceId = currentUser.ActiveSpaceId!.Value;
        var existing = await dbContext.CategoryRules.FirstOrDefaultAsync(
            item => item.SpaceId == spaceId && item.Scope == scope && item.Key == key,
            cancellationToken);
        if (existing is null)
        {
            dbContext.CategoryRules.Add(CategoryRule.CreateFromCorrection(scope, key, label, category, spaceId));
            return;
        }

        existing.ChangeCategory(category);
        existing.Label = label;
    }

    private async Task<int> ApplyToOthersAsync(Transaction corrected, CategoryRuleScope scope, string key, Category category, CancellationToken cancellationToken)
    {
        var others = scope switch
        {
            CategoryRuleScope.Counterparty => await dbContext.GetVisibleTransactions(currentUser)
                .Where(item => item.SpaceId == corrected.SpaceId && item.Id != corrected.Id && item.CounterpartyKey == key)
                .ToListAsync(cancellationToken),
            CategoryRuleScope.Merchant => (await dbContext.GetVisibleTransactions(currentUser)
                    .Where(item => item.SpaceId == corrected.SpaceId && item.Id != corrected.Id && item.CounterpartyKey == null && item.IsMerchantPayment && item.Counterparty != null)
                    .ToListAsync(cancellationToken))
                .Where(item => CategoryRuleKeys.For(null, item.Counterparty, isMerchantPayment: true)?.Key == key)
                .ToList(),
            _ => (await dbContext.GetVisibleTransactions(currentUser)
                    .Where(item => item.SpaceId == corrected.SpaceId && item.Id != corrected.Id && item.Purpose != null)
                    .ToListAsync(cancellationToken))
                .Where(item => PurposeKeywords.Contains(item.Purpose, key))
                .ToList()
        };

        // A rule never overwrites manual categories.
        var targets = others.Where(item => item.CategoryId != category.Id && item.CategorySource != CategorySource.Manual).ToList();
        foreach (var target in targets)
        {
            target.AssignCategoryAutomatically(category, CategorySource.Rule);
        }

        return targets.Count;
    }
}
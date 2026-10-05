using System.Security.Cryptography;
using System.Text;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.CategoryRules.Suggestions;

/// <summary>A rule Kijk suggests because a member set the same category for a merchant or counterparty by hand.</summary>
/// <param name="Id">A stable id of the suggestion, e.g. for hiding it.</param>
/// <param name="Scope">What the rule would match on.</param>
/// <param name="Label">The merchant or counterparty as shown in the transactions.</param>
/// <param name="CategoryId">The category set by hand.</param>
/// <param name="CategoryName">The category name.</param>
/// <param name="ManualCount">How often the category was set by hand.</param>
/// <param name="UncategorizedCount">How many transactions without category the rule would categorize right away.</param>
/// <param name="TransactionId">The latest transaction categorized by hand; remembering its category creates the rule.</param>
public sealed record CategoryRuleSuggestionResponse(
    string Id,
    CategoryRuleScope Scope,
    string Label,
    Guid CategoryId,
    string CategoryName,
    int ManualCount,
    int UncategorizedCount,
    Guid TransactionId);

/// <summary>
/// Suggests rules from repeated manual corrections, so recurring bookings get their category without the AI. Only
/// transactions the member can see count, and merchants or counterparties with a rule or conflicting manual
/// categories are left out.
/// </summary>
public sealed class GetCategoryRuleSuggestionsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>The maximum number of suggestions returned.</summary>
    public const int MaximumSuggestions = 20;

    private const int MinimumManualCount = 2;

    /// <summary>Gets the suggestions, most useful first.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The suggestions.</returns>
    public async Task<Result<List<CategoryRuleSuggestionResponse>>> GetAsync(CancellationToken cancellationToken)
    {
        var transactions = await dbContext.GetVisibleTransactions(currentUser)
            .Where(item => item.CategoryId == null || item.CategorySource == CategorySource.Manual)
            .Select(item => new
            {
                item.Id,
                item.CounterpartyKey,
                item.Counterparty,
                item.IsMerchantPayment,
                item.CategoryId,
                CategoryName = item.Category == null ? null : item.Category.Name,
                item.BookingDate
            })
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var existingRules = (await dbContext.GetVisibleRules(currentUser)
                .Where(item => item.SpaceId == currentUser.ActiveSpaceId)
                .Select(item => new { item.Scope, item.Key })
                .ToListAsync(cancellationToken))
            .Select(item => (item.Scope, item.Key))
            .ToHashSet();

        var suggestions = new List<CategoryRuleSuggestionResponse>();
        var groups = transactions
            .Select(item => (Rule: CategoryRuleKeys.For(item.CounterpartyKey, item.Counterparty, item.IsMerchantPayment), Transaction: item))
            .Where(item => item.Rule is not null && !existingRules.Contains(item.Rule.Value))
            .GroupBy(item => item.Rule!.Value);
        foreach (var group in groups)
        {
            var manual = group.Select(item => item.Transaction).Where(item => item.CategoryId is not null).ToList();
            var categories = manual.Select(item => item.CategoryId).Distinct().ToList();
            var uncategorized = group.Count(item => item.Transaction.CategoryId is null);
            // Conflicting corrections mean the merchant is not reliably one category.
            if (categories.Count != 1 || manual.Count < MinimumManualCount && (manual.Count == 0 || uncategorized == 0))
            {
                continue;
            }

            var latest = manual.MaxBy(item => item.BookingDate)!;
            suggestions.Add(new CategoryRuleSuggestionResponse(
                IdOf(group.Key.Scope, group.Key.Key),
                group.Key.Scope,
                latest.Counterparty ?? string.Empty,
                latest.CategoryId!.Value,
                latest.CategoryName ?? string.Empty,
                manual.Count,
                uncategorized,
                latest.Id));
        }

        return suggestions
            .OrderByDescending(item => item.UncategorizedCount)
            .ThenByDescending(item => item.ManualCount)
            .ThenBy(item => item.Label, StringComparer.OrdinalIgnoreCase)
            .Take(MaximumSuggestions)
            .ToList();
    }

    // The key of a counterparty is a pseudonymous hash already; hashing again keeps the id short and opaque.
    private static string IdOf(CategoryRuleScope scope, string key) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes($"{scope}\u001f{key}")))[..16];
}
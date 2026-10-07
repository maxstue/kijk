using System.Security.Cryptography;
using System.Text;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;

namespace Kijk.Application.Imports.Categorization;

/// <summary>
/// A distinct sanitized text that goes to the AI once, with the rows that share it.
/// </summary>
/// <param name="Key">A stable id of the text within the import, used to deselect it in the preview.</param>
/// <param name="Item">The text as it is sent.</param>
/// <param name="Rows">The rows that share the text.</param>
public sealed record AiContext(string Key, CategorizationItem Item, List<ImportCandidate> Rows);

/// <summary>
/// Builds what the AI categorization sends. The preview and the background job use the same code, so the preview
/// shows exactly what leaves the server.
/// </summary>
public static class AiContexts
{
    /// <summary>Returns the rows that may be categorized: valid, imported, without category and no card statement.</summary>
    /// <param name="dbContext">The database context.</param>
    /// <param name="importJobId">The import.</param>
    /// <returns>The query, ordered by row number.</returns>
    public static IQueryable<ImportCandidate> Eligible(IAppDbContext dbContext, Guid importJobId) =>
        dbContext.ImportCandidates
            .Where(item => item.ImportJobId == importJobId
                           && item.Errors == null
                           && !item.Excluded
                           && !item.IsCardSettlement
                           && item.CategoryId == null)
            .OrderBy(item => item.RowNumber);

    /// <summary>Loads the display names of the space members, which are never sent.</summary>
    /// <param name="dbContext">The database context.</param>
    /// <param name="spaceId">The space.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The names.</returns>
    public static Task<List<string>> LoadMemberNamesAsync(IAppDbContext dbContext, Guid spaceId, CancellationToken cancellationToken) =>
        dbContext.UserSpaces
            .Where(link => link.SpaceId == spaceId)
            .Select(link => link.User.Name)
            .ToListAsync(cancellationToken);

    /// <summary>Groups rows by their sanitized text. Rows with nothing left to send are returned as withheld.</summary>
    /// <param name="candidates">The eligible rows.</param>
    /// <param name="memberNames">The space members' names.</param>
    /// <returns>The distinct texts and the number of withheld rows.</returns>
    public static (List<AiContext> Contexts, int Withheld) Build(IEnumerable<ImportCandidate> candidates, IReadOnlyCollection<string> memberNames)
    {
        var contexts = new Dictionary<string, AiContext>(StringComparer.Ordinal);
        var withheld = 0;
        foreach (var candidate in candidates)
        {
            var sanitized = TransactionSanitizer.Sanitize(candidate.Counterparty, candidate.Purpose, candidate.IsMerchantPayment, memberNames);
            if (sanitized is null)
            {
                withheld++;
                continue;
            }

            var income = candidate.Amount > 0;
            var key = KeyOf(sanitized, income);
            if (!contexts.TryGetValue(key, out var context))
            {
                context = new AiContext(key, new CategorizationItem(contexts.Count, sanitized.Counterparty, sanitized.Purpose, income), []);
                contexts[key] = context;
            }

            context.Rows.Add(candidate);
        }

        return ([.. contexts.Values], withheld);
    }

    private static string KeyOf(SanitizedTransaction sanitized, bool income)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{sanitized.Counterparty}\u001f{sanitized.Purpose}\u001f{income}"));
        return Convert.ToHexStringLower(hash)[..16];
    }
}
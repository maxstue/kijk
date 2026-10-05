using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.CategoryRules.Shared;

/// <summary>A remembered category correction.</summary>
/// <param name="Id">The rule id.</param>
/// <param name="Scope">What the rule matches on.</param>
/// <param name="Label">The counterparty name shown when the rule was created.</param>
/// <param name="CategoryId">The assigned category.</param>
/// <param name="CategoryName">The assigned category's name.</param>
/// <param name="Visibility">Whether the rule applies to the whole space or only to the member's private accounts.</param>
/// <param name="CreatedAt">When the rule was created.</param>
public sealed record CategoryRuleResponse(Guid Id, CategoryRuleScope Scope, string Label, Guid CategoryId, string CategoryName, DateTime CreatedAt, Visibility Visibility);

/// <summary>
/// Maps category rules to API responses.
/// </summary>
public static class CategoryRuleResponseMapper
{
    /// <summary>Maps a rule with its loaded category.</summary>
    /// <param name="source">The rule.</param>
    /// <returns>The response.</returns>
    public static CategoryRuleResponse ToResponse(this CategoryRule source) =>
        new(source.Id, source.Scope, source.Label, source.CategoryId, source.Category?.Name ?? string.Empty, source.CreatedAt, source.Visibility);
}
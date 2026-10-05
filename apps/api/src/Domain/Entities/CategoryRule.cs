using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// Assigns a category to future imported transactions of a merchant or counterparty. Rules are created when a user
/// chooses to remember a correction. A rule never matches on a placeholder such as <c>[PERSON]</c>.
/// </summary>
public sealed class CategoryRule : BaseEntity
{
    /// <summary>Gets what the rule matches on.</summary>
    public required CategoryRuleScope Scope { get; init; }

    /// <summary>Gets the normalized merchant name or the pseudonymous counterparty key.</summary>
    public required string Key { get; init; }

    /// <summary>Gets the counterparty name shown to users when the rule was created.</summary>
    public required string Label { get; set; }

    /// <summary>Gets how the rule was created.</summary>
    public required CategoryRuleOrigin Origin { get; init; }

    /// <summary>Gets the priority; higher priorities win.</summary>
    public int Priority { get; init; }

    /// <summary>Gets the id of <see cref="Category" />.</summary>
    public Guid CategoryId { get; private set; }

    /// <summary>Gets the assigned category.</summary>
    public Category? Category { get; private set; }

    /// <summary>Gets or sets the id of <see cref="Household" />.</summary>
    public Guid HouseholdId { get; set; }

    /// <summary>Gets or sets the household the rule belongs to.</summary>
    public Household? Household { get; set; }

    /// <summary>Creates a rule a user chose to remember.</summary>
    /// <param name="scope">What the rule matches on.</param>
    /// <param name="key">The normalized merchant name or counterparty key.</param>
    /// <param name="label">The counterparty name shown to users.</param>
    /// <param name="category">The category to assign.</param>
    /// <param name="householdId">The owning household.</param>
    /// <returns>The new rule.</returns>
    public static CategoryRule CreateFromCorrection(CategoryRuleScope scope, string key, string label, Category category, Guid householdId)
    {
        var rule = new CategoryRule
        {
            Scope = scope,
            Key = key,
            Label = label,
            Origin = CategoryRuleOrigin.User,
            HouseholdId = householdId
        };
        rule.ChangeCategory(category);
        return rule;
    }

    /// <summary>Changes the assigned category.</summary>
    /// <param name="category">The category.</param>
    public void ChangeCategory(Category category)
    {
        Category = category;
        CategoryId = category.Id;
    }
}
using Kijk.Domain.ValueObjects;
using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// A monthly spending target for an expense category. A budget applies from <see cref="ValidFrom" /> until the next
/// budget of the same category starts, so past months stay traceable after a change.
/// </summary>
public sealed class Budget : BaseEntity
{
    /// <summary>Gets or sets the monthly amount in EUR.</summary>
    public required decimal Amount { get; set; }

    /// <summary>Gets or sets the first day (UTC) of the first month the budget applies to.</summary>
    public required DateTime ValidFrom { get; set; }

    /// <summary>Gets or sets whether the budget is evaluated. An inactive budget pauses the category's target.</summary>
    public required bool Active { get; set; }

    /// <summary>Gets or sets the id of <see cref="Category" />.</summary>
    public Guid CategoryId { get; set; }

    /// <summary>Gets or sets the category the budget applies to.</summary>
    public required Category Category { get; set; }

    /// <summary>Gets or sets the id of <see cref="CreatedBy" />.</summary>
    public Guid CreatedById { get; set; }

    /// <summary>Gets or sets the user that created the budget.</summary>
    public required User CreatedBy { get; set; }

    /// <summary>Gets or sets the id of <see cref="Household" />.</summary>
    public Guid HouseholdId { get; set; }

    /// <summary>
    /// Gets the member who alone sees and uses this budget, or <see langword="null" /> for a budget of the whole space.
    /// For its owner a private budget replaces the shared budget of the same category.
    /// </summary>
    public Guid? OwnerId { get; }

    /// <summary>Gets the owner of a private budget.</summary>
    public User? Owner { get; private set; }

    /// <summary>Gets who can see the budget.</summary>
    public Visibility Visibility => OwnerId is null ? Visibility.Shared : Visibility.Private;

    /// <summary>Gets or sets the household the budget belongs to.</summary>
    public required Household Household { get; set; }

    /// <summary>Creates a budget for a category starting in the given month.</summary>
    /// <param name="amount">The monthly amount.</param>
    /// <param name="validFrom">The first month the budget applies to.</param>
    /// <param name="active">Whether the budget is evaluated.</param>
    /// <param name="category">The expense category.</param>
    /// <param name="createdBy">The creating user.</param>
    /// <param name="household">The owning household.</param>
    /// <returns>The new budget.</returns>
    public static Budget Create(
        decimal amount,
        MonthYear validFrom,
        bool active,
        Category category,
        User createdBy,
        Household household,
        Visibility visibility = Visibility.Shared) =>
        new()
        {
            Amount = amount,
            ValidFrom = validFrom.ToDateTime(),
            Active = active,
            Category = category,
            CreatedBy = createdBy,
            Household = household,
            Owner = visibility == Visibility.Private ? createdBy : null
        };

    /// <summary>Updates the amount and active state of this budget version.</summary>
    /// <param name="amount">The monthly amount.</param>
    /// <param name="active">Whether the budget is evaluated.</param>
    public void Update(decimal amount, bool active)
    {
        Amount = amount;
        Active = active;
    }
}
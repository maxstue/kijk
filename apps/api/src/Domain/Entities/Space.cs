using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>A space: the unit that owns consumptions, limits, resources and finances and that users are members of.</summary>
public sealed class Space : BaseEntity
{
    /// <summary>Gets or sets the space name.</summary>
    public required string Name { get; set; }
    /// <summary>Gets or sets an optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Gets how much of the purpose text is kept when imported transactions are stored.</summary>
    public PurposeRetention PurposeRetention { get; private set; }

    /// <summary>Gets which transaction data the AI categorization may see.</summary>
    public AiDataSharing AiDataSharing { get; private set; }

    /// <summary>
    /// Gets whether imports store as little as possible: names of private persons are replaced before saving and no
    /// key of the counterparty IBAN is kept, so remembered categories only match merchants and keywords.
    /// </summary>
    public bool MinimizeData { get; private set; }

    /// <summary>
    /// Gets whether this is a member's personal space: created automatically, never shared and never deleted.
    /// </summary>
    public bool IsPersonal { get; private set; }

    /// <summary>Gets the memberships of this space.</summary>
    public ICollection<UserSpace> UserSpaces { get; init; } = new List<UserSpace>();
    /// <summary>Gets the consumptions recorded for this space.</summary>
    public ICollection<Consumption> Consumptions { get; init; } = new List<Consumption>();
    /// <summary>Gets the consumption limits of this space.</summary>
    public ICollection<Limit> Limits { get; init; } = new List<Limit>();
    /// <summary>Gets the custom resources owned by this space.</summary>
    public ICollection<Resource> Resources { get; init; } = new List<Resource>();
    /// <summary>Gets the units shared with this space.</summary>
    public ICollection<UnitSpace> UnitSpaces { get; init; } = new List<UnitSpace>();
    /// <summary>Gets the custom categories owned by this space.</summary>
    public ICollection<Category> Categories { get; init; } = new List<Category>();
    /// <summary>Gets the budgets of this space.</summary>
    public ICollection<Budget> Budgets { get; init; } = new List<Budget>();
    /// <summary>Gets the bank accounts of this space.</summary>
    public ICollection<Account> Accounts { get; init; } = new List<Account>();
    /// <summary>Gets the transactions of this space.</summary>
    public ICollection<Transaction> Transactions { get; init; } = new List<Transaction>();
    /// <summary>Gets the category rules of this space.</summary>
    public ICollection<CategoryRule> CategoryRules { get; init; } = new List<CategoryRule>();
    /// <summary>Gets the imports of this space.</summary>
    public ICollection<ImportJob> ImportJobs { get; init; } = new List<ImportJob>();

    /// <summary>Creates a space with its cash account.</summary>
    /// <param name="name">The space name.</param>
    /// <param name="description">An optional description.</param>
    /// <returns>The new space.</returns>
    public static Space Create(string name, string? description = null)
    {
        var space = new Space
        {
            Name = name,
            Description = description,
        };
        space.Accounts.Add(Account.CreateCash(space));
        return space;
    }

    /// <summary>Creates the personal space of a user with its cash account.</summary>
    /// <returns>The new personal space.</returns>
    public static Space CreatePersonal()
    {
        var space = Create(PersonalName);
        space.IsPersonal = true;
        return space;
    }

    /// <summary>The default name of a personal space.</summary>
    public const string PersonalName = "Personal";

    /// <summary>Sets how much of the purpose text is kept when imported transactions are stored.</summary>
    /// <param name="retention">The retention.</param>
    public void SetPurposeRetention(PurposeRetention retention) => PurposeRetention = retention;

    /// <summary>Sets which transaction data the AI categorization may see.</summary>
    /// <param name="sharing">The level.</param>
    public void SetAiDataSharing(AiDataSharing sharing) => AiDataSharing = sharing;

    /// <summary>Turns the data-minimizing import mode on or off. Transactions imported earlier stay as stored.</summary>
    /// <param name="minimize">Whether imports store as little as possible.</param>
    public void SetMinimizeData(bool minimize) => MinimizeData = minimize;

    /// <summary>Renames the space.</summary>
    /// <param name="name">The new name.</param>
    public void Rename(string name) => Name = name;

    /// <summary>
    /// Updates the editable space details.
    /// </summary>
    /// <param name="name">The new space name.</param>
    /// <param name="description">The new space description, if provided.</param>
    public void UpdateDetails(string name, string? description)
    {
        Name = name;
        Description = description;
    }
}
namespace Kijk.Domain.Entities;

/// <summary>
/// A bank account of a household. Transactions are assigned to accounts so duplicates can be checked per account.
/// </summary>
public sealed class Account : BaseEntity
{
    /// <summary>Gets or sets the display name.</summary>
    public required string Name { get; set; }

    /// <summary>Gets or sets the last four characters of the IBAN. The full IBAN is never stored.</summary>
    public string? IbanLast4 { get; set; }

    /// <summary>Gets or sets the id of <see cref="Household" />.</summary>
    public Guid HouseholdId { get; set; }

    /// <summary>Gets or sets the household the account belongs to.</summary>
    public required Household Household { get; set; }

    /// <summary>Creates an account for a household.</summary>
    /// <param name="name">The display name.</param>
    /// <param name="ibanLast4">The last four characters of the IBAN, if known.</param>
    /// <param name="household">The owning household.</param>
    /// <returns>The new account.</returns>
    public static Account Create(string name, string? ibanLast4, Household household) =>
        new()
        {
            Name = name,
            IbanLast4 = ibanLast4,
            Household = household
        };

    /// <summary>Updates the editable properties of the account.</summary>
    /// <param name="name">The display name.</param>
    /// <param name="ibanLast4">The last four characters of the IBAN, if known.</param>
    public void Update(string name, string? ibanLast4)
    {
        Name = name;
        IbanLast4 = ibanLast4;
    }
}
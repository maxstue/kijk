using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// A bank account of a space. Transactions are assigned to accounts so duplicates can be checked per account.
/// </summary>
public sealed class Account : BaseEntity
{
    /// <summary>Gets or sets the display name.</summary>
    public required string Name { get; set; }

    /// <summary>Gets or sets the last four characters of the IBAN. The full IBAN is never stored.</summary>
    public string? IbanLast4 { get; set; }

    /// <summary>Gets or sets whether this is a bank account or the space's cash account.</summary>
    public AccountKind Kind { get; set; }

    /// <summary>Gets or sets the id of <see cref="Space" />.</summary>
    public Guid SpaceId { get; set; }

    /// <summary>
    /// Gets the member who alone can see the account and its transactions, or <see langword="null" /> when every member
    /// of the space can.
    /// </summary>
    public Guid? OwnerId { get; private set; }

    /// <summary>Gets the owner of a private account.</summary>
    public User? Owner { get; }

    /// <summary>Gets who can see the account.</summary>
    public Visibility Visibility => OwnerId is null ? Visibility.Shared : Visibility.Private;

    /// <summary>Gets or sets the space the account belongs to.</summary>
    public required Space Space { get; set; }

    /// <summary>Creates an account for a space.</summary>
    /// <param name="name">The display name.</param>
    /// <param name="ibanLast4">The last four characters of the IBAN, if known.</param>
    /// <param name="space">The owning space.</param>
    /// <returns>The new account.</returns>
    public static Account Create(string name, string? ibanLast4, Space space) =>
        new()
        {
            Name = name,
            IbanLast4 = ibanLast4,
            Kind = AccountKind.Bank,
            Space = space
        };

    /// <summary>Creates the cash account of a space. Imports never replace its transactions.</summary>
    /// <param name="space">The owning space.</param>
    /// <returns>The new cash account.</returns>
    public static Account CreateCash(Space space) =>
        new()
        {
            Name = "Cash",
            Kind = AccountKind.Cash,
            Space = space
        };

    /// <summary>Updates the editable properties of the account.</summary>
    /// <param name="name">The display name.</param>
    /// <param name="ibanLast4">The last four characters of the IBAN, if known.</param>
    public void Update(string name, string? ibanLast4)
    {
        Name = name;
        IbanLast4 = ibanLast4;
    }

    /// <summary>Makes the account private to a member or shares it with the whole space.</summary>
    /// <param name="ownerId">The member, or <see langword="null" /> to share the account.</param>
    public void SetOwner(Guid? ownerId) => OwnerId = Kind == AccountKind.Cash ? null : ownerId;
}
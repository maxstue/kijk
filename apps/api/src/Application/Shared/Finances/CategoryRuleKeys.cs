using Kijk.Domain.Services;
using Kijk.Shared;

namespace Kijk.Application.Shared.Finances;

/// <summary>
/// Decides what a remembered category correction matches on. Bookings with a counterparty IBAN are matched by its
/// pseudonymous key, so people are only ever matched by their account. Without an IBAN only card payments and direct
/// debits are matched by the normalized merchant name; transfers could go to people and are never matched by name.
/// </summary>
public static class CategoryRuleKeys
{
    /// <summary>Returns the scope and key a rule for this booking would use.</summary>
    /// <param name="counterpartyKey">The pseudonymous key of the counterparty IBAN, if any.</param>
    /// <param name="counterparty">The counterparty name, if any.</param>
    /// <param name="isMerchantPayment">Whether the booking is a card payment or direct debit.</param>
    /// <returns>The scope and key, or <see langword="null" /> when the booking cannot be recognized again.</returns>
    public static (CategoryRuleScope Scope, string Key)? For(string? counterpartyKey, string? counterparty, bool isMerchantPayment)
    {
        if (counterpartyKey is not null)
        {
            return (CategoryRuleScope.Counterparty, counterpartyKey);
        }

        return isMerchantPayment && MerchantNameNormalizer.Normalize(counterparty) is { } merchant
            ? (CategoryRuleScope.Merchant, merchant)
            : null;
    }
}
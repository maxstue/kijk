using System.Text.RegularExpressions;

namespace Kijk.Domain.Services;

/// <summary>
/// Recognizes the monthly statement of a credit card on the giro account. It settles purchases that may be imported
/// from the card account as well, so it is shown for review instead of being counted twice.
/// </summary>
public static partial class CardSettlementDetector
{
    /// <summary>Returns whether a booking looks like a credit card statement.</summary>
    /// <param name="amount">The signed amount; only outgoing payments settle a card.</param>
    /// <param name="counterparty">The counterparty.</param>
    /// <param name="purpose">The purpose.</param>
    /// <returns><see langword="true" /> for a likely card statement.</returns>
    public static bool IsSettlement(decimal amount, string? counterparty, string? purpose) =>
        amount < 0 && Settlement().IsMatch($"{counterparty} {purpose}");

    // "Kreditkartenabrechnung", "Abrechnung Kreditkarte", "VISA Abrechnung", "Ausgleich Kreditkarte", "Mastercard Saldo".
    [GeneratedRegex(
        @"kreditkart\w*\s*(abrechnung|ausgleich|saldo)|(abrechnung|ausgleich|saldenausgleich|saldo)\s+(der\s+)?(kredit)?karte|kartenabrechnung|(visa|mastercard|master\s?card|amex|american\s+express)\b.{0,20}\b(abrechnung|ausgleich|saldo|statement)|credit\s+card\s+(statement|payment)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        matchTimeoutMilliseconds: 1000)]
    private static partial Regex Settlement();
}
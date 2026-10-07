using Kijk.Domain.Services;

namespace Kijk.UnitTests.Imports;

public class TransactionSanitizerTests
{
    private static readonly string[] Members = ["Erika Beispiel", "Max"];

    [Test]
    public async Task MerchantPaymentsKeepTheirNameButLoseIdentifiers()
    {
        var result = TransactionSanitizer.Sanitize(
            "REWE Markt",
            "Einkauf DE89370400440532013000 EREF: ABC123 Karte 4111 1111 1111 1111 info@example.test",
            isMerchantPayment: true,
            Members);

        await Assert.That(result!.Counterparty).IsEqualTo("REWE Markt");
        await Assert.That(result.Purpose).IsEqualTo("Einkauf [IBAN] [REF] Karte [NR] [EMAIL]");
    }

    [Test]
    public async Task PrivatePersonsAreReplacedInCounterpartyAndPurpose()
    {
        var result = TransactionSanitizer.Sanitize("Hans Müller", "Miete Oktober von Hans Müller", isMerchantPayment: false, Members);

        await Assert.That(result!.Counterparty).IsEqualTo(TransactionSanitizer.Person);
        await Assert.That(result.Purpose).IsEqualTo($"Miete Oktober von {TransactionSanitizer.Person}");
    }

    [Test]
    [Arguments("Muster Arbeitgeber GmbH")]
    [Arguments("Stadtwerke Beispielstadt")]
    [Arguments("Müller & Söhne")]
    public async Task CompaniesAreKeptWhenTheyLookLikeCompanies(string name)
    {
        var result = TransactionSanitizer.Sanitize(name, "Rechnung", isMerchantPayment: false, Members);

        await Assert.That(result!.Counterparty).IsEqualTo(name);
    }

    [Test]
    public async Task SpaceMembersAreReplacedEverywhere()
    {
        var result = TransactionSanitizer.Sanitize("Muster AG", "Beitrag für erika beispiel und Max", isMerchantPayment: true, Members);

        await Assert.That(result!.Purpose).IsEqualTo($"Beitrag für {TransactionSanitizer.Person} und {TransactionSanitizer.Person}");
    }

    [Test]
    public async Task TheCreditorIdAndBicAreRemoved()
    {
        var result = TransactionSanitizer.Sanitize("Muster AG", "Gläubiger DE98ZZZ09999999999 BIC: COBADEFFXXX Beitrag", isMerchantPayment: true, Members);

        await Assert.That(result!.Purpose).IsEqualTo("Gläubiger [IBAN] [BIC] Beitrag");
    }

    [Test]
    public async Task APersonWithoutAnyPurposeIsWithheld()
    {
        await Assert.That(TransactionSanitizer.Sanitize("Hans Müller", null, isMerchantPayment: false, Members)).IsNull();
        await Assert.That(TransactionSanitizer.Sanitize(null, "  ", isMerchantPayment: false, Members)).IsNull();
    }

    [Test]
    [Arguments("Amazon EU S.a.r.l.")]
    [Arguments("Tafel Beispielstadt e.V.")]
    public async Task LegalFormsWithDotsCountAsCompanies(string name) =>
        await Assert.That(TransactionSanitizer.Sanitize(name, "Spende", isMerchantPayment: false, Members)!.Counterparty).IsEqualTo(name);

    [Test]
    public async Task ReplacingPersonsKeepsEverythingElse()
    {
        var (counterparty, purpose) = TransactionSanitizer.ReplacePersons("Hans Müller", "Miete Hans Müller EREF 123", isMerchantPayment: false, Members);

        await Assert.That(counterparty).IsEqualTo(TransactionSanitizer.Person);
        await Assert.That(purpose).IsEqualTo($"Miete {TransactionSanitizer.Person} EREF 123");
    }

    [Test]
    [Arguments(-420, "Musterbank", "Kreditkartenabrechnung 09/2026", true)]
    [Arguments(-80, "Musterbank", "VISA Abrechnung Oktober", true)]
    [Arguments(-80, "DKB", "Ausgleich Kreditkarte", true)]
    [Arguments(-80, "Amex", "American Express Saldo", true)]
    [Arguments(80, "Musterbank", "Kreditkartenabrechnung Gutschrift", false)]
    [Arguments(-3.2, "Bäckerei", "Kartenzahlung", false)]
    [Arguments(-30, "Visa Reisebüro", "Urlaub", false)]
    public async Task CardStatementsAreRecognized(double amount, string counterparty, string purpose, bool expected) =>
        await Assert.That(CardSettlementDetector.IsSettlement((decimal)amount, counterparty, purpose)).IsEqualTo(expected);
}
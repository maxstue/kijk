using Kijk.Application.Imports.Csv;
using Kijk.Shared;

namespace Kijk.UnitTests.Imports;

public class CsvImportTests
{
    [Test]
    public async Task DkbStyleExportIsDetectedAndParsedWithoutErrors()
    {
        var (table, mapping) = CsvSamples.Detect("dkb-synthetic.csv");

        await Assert.That(mapping.Encoding).IsEqualTo(CsvDecoder.Utf8);
        await Assert.That(mapping.Delimiter).IsEqualTo(";");
        await Assert.That(table.Records[mapping.HeaderRowIndex].Fields[0]).IsEqualTo("Buchungsdatum");
        await Assert.That(mapping.DateFormat).IsEqualTo("dd.MM.yy");
        await Assert.That(mapping.DecimalSeparator).IsEqualTo(",");
        await Assert.That(mapping.StatusColumn).IsEqualTo(2);
        await Assert.That(mapping.PayerColumn).IsEqualTo(3);
        await Assert.That(mapping.CounterpartyColumn).IsEqualTo(4);
        await Assert.That(mapping.PurposeColumn).IsEqualTo(5);
        await Assert.That(mapping.CounterpartyIbanColumn).IsEqualTo(7);
        await Assert.That(mapping.AmountColumn).IsEqualTo(8);
        await Assert.That(mapping.CreditorIdColumn).IsEqualTo(9);
        await Assert.That(MappingValidator.Validate(mapping, table)).IsEmpty();

        var rows = ParseAll(table, mapping);
        await Assert.That(rows.Count).IsEqualTo(8);
        await Assert.That(rows.All(row => row.IsValid)).IsTrue();
        await Assert.That(rows[0].Status).IsEqualTo(TransactionStatus.Pending);
        await Assert.That(rows[0].Amount).IsEqualTo(-23.45m);
        await Assert.That(rows[2].Amount).IsEqualTo(2500m);
        await Assert.That(rows[4].Amount).IsEqualTo(-750m);
        // Incoming payments take the payer as counterparty, outgoing ones the payee.
        await Assert.That(rows[2].Counterparty).IsEqualTo("Muster Arbeitgeber GmbH");
        await Assert.That(rows[1].Counterparty).IsEqualTo("Stadtwerke Beispielstadt");
        await Assert.That(rows[0].Date).IsEqualTo(new DateTime(2026, 11, 30, 0, 0, 0, DateTimeKind.Utc));
    }

    [Test]
    public async Task IngStyleExportInWindows1252IsDetectedAndParsedWithoutErrors()
    {
        var (table, mapping) = CsvSamples.Detect("ing-synthetic.csv");

        await Assert.That(mapping.Encoding).IsEqualTo(CsvDecoder.Windows1252);
        await Assert.That(table.Records[mapping.HeaderRowIndex].Fields[0]).IsEqualTo("Buchung");
        await Assert.That(mapping.DateColumn).IsEqualTo(0);
        await Assert.That(mapping.CounterpartyColumn).IsEqualTo(2);
        await Assert.That(mapping.PurposeColumn).IsEqualTo(4);
        await Assert.That(mapping.AmountColumn).IsEqualTo(8);
        await Assert.That(mapping.BankReferenceColumn).IsNull();
        await Assert.That(mapping.BookingTypeColumn).IsEqualTo(3);
        await Assert.That(MappingValidator.Validate(mapping, table)).IsEmpty();

        var rows = ParseAll(table, mapping);
        await Assert.That(rows.Count).IsEqualTo(5);
        await Assert.That(rows.All(row => row.IsValid)).IsTrue();
        await Assert.That(rows[0].Counterparty).IsEqualTo("Bäckerei Schön");
        await Assert.That(rows[1].Amount).IsEqualTo(-1023.45m);
        // Real exports omit the decimals of whole amounts.
        await Assert.That(rows[2].Amount).IsEqualTo(-46m);
        await Assert.That(rows[4].Purpose).IsEqualTo("Tanken € 1,89/l");
        // "Lastschrift" marks a merchant payment, "Gehalt/Rente" does not.
        await Assert.That(rows[0].IsMerchantPayment).IsTrue();
        await Assert.That(rows[3].IsMerchantPayment).IsFalse();
    }

    [Test]
    public async Task EnglishCommaSeparatedExportUsesPointDecimals()
    {
        var (table, mapping) = CsvSamples.Detect("generic-comma.csv");

        await Assert.That(mapping.Delimiter).IsEqualTo(",");
        await Assert.That(mapping.DateFormat).IsEqualTo("yyyy-MM-dd");
        await Assert.That(mapping.DecimalSeparator).IsEqualTo(".");

        var rows = ParseAll(table, mapping);
        await Assert.That(rows.Select(row => row.Amount)).IsEquivalentTo(new decimal?[] { -54.20m, -89.00m, 2450.00m, 12.30m });
        await Assert.That(rows[1].Purpose).IsEqualTo("Concert tickets, two seats");
    }

    [Test]
    [Arguments("-1.234,56", ",", -1234.56)]
    [Arguments("1.234,56 €", ",", 1234.56)]
    [Arguments("12,50-", ",", -12.50)]
    [Arguments("+7,00", ",", 7.00)]
    [Arguments("1,234.56", ".", 1234.56)]
    [Arguments("-0.99", ".", -0.99)]
    public async Task AmountsAreParsedInBothNotations(string value, string separator, double expected) =>
        await Assert.That(CsvRowParser.ParseAmount(value, separator)).IsEqualTo((decimal)expected);

    [Test]
    [Arguments("")]
    [Arguments("abc")]
    [Arguments("1.2.3")]
    public async Task InvalidAmountsAreRejectedInsteadOfGuessed(string value) =>
        await Assert.That(CsvRowParser.ParseAmount(value, ".")).IsNull();

    [Test]
    public async Task DebitAndCreditColumnsAreCombined()
    {
        var mapping = new CsvImportMapping(";", CsvDecoder.Utf8, 0, 0, "dd.MM.yyyy", null, 1, 2, ",", 3, null, null, null, null, null, null);

        var debit = CsvRowParser.Parse(new CsvRecord(2, ["01.10.2026", "12,00", "", "Shop"]), mapping);
        var credit = CsvRowParser.Parse(new CsvRecord(3, ["01.10.2026", "", "5,00", "Shop"]), mapping);

        await Assert.That(debit.Amount).IsEqualTo(-12m);
        await Assert.That(credit.Amount).IsEqualTo(5m);
    }

    [Test]
    public async Task InvalidRowsReportTheColumnButNotTheContent()
    {
        var mapping = new CsvImportMapping(";", CsvDecoder.Utf8, 0, 0, "dd.MM.yyyy", 1, null, null, ",", 2, null, null, null, null, null, null);

        var row = CsvRowParser.Parse(new CsvRecord(5, ["31.02.2026", "secret", "Shop"]), mapping);

        await Assert.That(row.IsValid).IsFalse();
        await Assert.That(row.Errors.Count).IsEqualTo(2);
        await Assert.That(row.Errors.Any(error => error.Contains("secret", StringComparison.Ordinal))).IsFalse();
    }

    [Test]
    public async Task ValidatorRejectsMappingsThatDoNotParseTheFirstRows()
    {
        var (table, mapping) = CsvSamples.Detect("dkb-synthetic.csv");

        var errors = MappingValidator.Validate(mapping with { DateFormat = "yyyy-MM-dd" }, table);
        var duplicate = MappingValidator.Validate(mapping with { PurposeColumn = mapping.AmountColumn }, table);

        await Assert.That(errors).IsNotEmpty();
        await Assert.That(duplicate).Contains("A column is mapped more than once");
    }

    [Test]
    public async Task HeaderFingerprintIgnoresCaseAndSpacingButNotDelimiterOrEncoding()
    {
        var first = HeaderFingerprint.Compute(["Datum", " Betrag "], ";", CsvDecoder.Utf8);

        await Assert.That(HeaderFingerprint.Compute(["datum", "betrag"], ";", CsvDecoder.Utf8)).IsEqualTo(first);
        await Assert.That(HeaderFingerprint.Compute(["datum", "betrag"], ",", CsvDecoder.Utf8)).IsNotEqualTo(first);
        await Assert.That(HeaderFingerprint.Compute(["datum", "betrag"], ";", CsvDecoder.Windows1252)).IsNotEqualTo(first);
    }

    [Test]
    public async Task OnlyMerchantPaymentsWithoutIbanCanBeRememberedByName()
    {
        await Assert.That(Kijk.Application.Shared.Finances.CategoryRuleKeys.For(null, "REWE Markt GmbH", isMerchantPayment: true))
            .IsEqualTo((CategoryRuleScope.Merchant, "rewe"));
        // A transfer without IBAN could go to a person, so it is never matched by name.
        await Assert.That(Kijk.Application.Shared.Finances.CategoryRuleKeys.For(null, "Max Mustermann", isMerchantPayment: false)).IsNull();
        await Assert.That(Kijk.Application.Shared.Finances.CategoryRuleKeys.For("key", "Max Mustermann", isMerchantPayment: false))
            .IsEqualTo((CategoryRuleScope.Counterparty, "key"));
    }

    [Test]
    public async Task CreditorIdMarksADirectDebit()
    {
        var mapping = new CsvImportMapping(";", CsvDecoder.Utf8, 0, 0, "dd.MM.yyyy", 1, null, null, ",", 2, null, null, null, 3, null, null);

        var row = CsvRowParser.Parse(new CsvRecord(2, ["01.10.2026", "-9,99", "Streaming GmbH", "DE98ZZZ09999999999"]), mapping);

        await Assert.That(row.IsMerchantPayment).IsTrue();
    }

    private static List<ParsedRow> ParseAll(CsvTable table, CsvImportMapping mapping) =>
        [.. table.Records.Skip(mapping.HeaderRowIndex + 1).Select(record => CsvRowParser.Parse(record, mapping))];
}
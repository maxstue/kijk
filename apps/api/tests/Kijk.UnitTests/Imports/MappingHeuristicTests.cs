using Kijk.Application.Imports.Csv;

namespace Kijk.UnitTests.Imports;

// Columns whose names are unknown are recognized by their values, so imports work without the AI format detection.
public class MappingHeuristicTests
{
    [Test]
    public async Task UnknownColumnNamesAreRecognizedByTheirValues()
    {
        var mapping = Suggest("""
            Tag;Konto;Partner;Info;Währung;Wert;Stand
            30.10.2026;DE00123456781234567890;REWE Markt;Einkauf Lebensmittel Woche 44;EUR;-23,45;976,55
            28.10.2026;DE00123456781234567890;Stadtwerke Beispielstadt;Abschlag Strom Oktober Vertrag 7;EUR;-85,00;1.000,00
            15.10.2026;DE00123456781234567890;Muster Arbeitgeber GmbH;Gehalt Oktober Personalnummer 42;EUR;2.500,00;1.085,00
            02.10.2026;DE00123456781234567890;Kino am Markt;Abendvorstellung zwei Karten;EUR;-12,50;-1.415,00
            """);

        await Assert.That(mapping.DateColumn).IsEqualTo(0);
        await Assert.That(mapping.DateFormat).IsEqualTo("dd.MM.yyyy");
        // The balance column "Stand" changes by the amount from row to row, so "Wert" is the amount.
        await Assert.That(mapping.AmountColumn).IsEqualTo(5);
        await Assert.That(mapping.DecimalSeparator).IsEqualTo(",");
        await Assert.That(mapping.PurposeColumn).IsEqualTo(3);
        await Assert.That(mapping.CounterpartyColumn).IsEqualTo(2);
        // The own account repeats in every row and the currency is constant: neither is a counterparty field.
        await Assert.That(mapping.CounterpartyIbanColumn).IsNull();
    }

    [Test]
    public async Task VaryingIbansAreTheCounterpartyIban()
    {
        var mapping = Suggest("""
            When;Who;Account;What;How much
            2026-10-30;REWE Markt;DE89370400440532013000;Weekly groceries and drinks;-23.45
            2026-10-28;Stadtwerke;DE02120300000000202051;Electricity advance payment;-85.00
            2026-10-15;Employer Ltd;DE12500105170648489890;Salary October;2500.00
            """);

        await Assert.That(mapping.DateFormat).IsEqualTo("yyyy-MM-dd");
        await Assert.That(mapping.AmountColumn).IsEqualTo(4);
        await Assert.That(mapping.DecimalSeparator).IsEqualTo(".");
        await Assert.That(mapping.CounterpartyIbanColumn).IsEqualTo(2);
        await Assert.That(mapping.PurposeColumn).IsEqualTo(3);
        await Assert.That(mapping.CounterpartyColumn).IsEqualTo(1);
    }

    [Test]
    public async Task ReferenceNumbersAreNoAmounts()
    {
        var mapping = Suggest("""
            Datum;Nr;Text;Summe
            01.10.2026;10001;Einkauf im Markt am Platz;-3,20
            02.10.2026;10002;Kinokarten für Freitag;-12,00
            03.10.2026;10003;Erstattung vom Händler;5,10
            """);

        await Assert.That(mapping.AmountColumn).IsEqualTo(3);
    }

    private static CsvImportMapping Suggest(string csv)
    {
        var table = CsvTable.Read(csv, ';');
        return MappingSuggester.Suggest(table, ';', CsvDecoder.Utf8, 0) ?? throw new InvalidOperationException("No mapping suggested");
    }
}
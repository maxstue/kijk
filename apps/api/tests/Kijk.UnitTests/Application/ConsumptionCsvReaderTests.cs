using System.Text;
using Kijk.Application.Consumptions.Export;
using Kijk.Application.Consumptions.Import;
using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.UnitTests.Application;

public class ConsumptionCsvReaderTests
{
    [Test]
    public async Task ReadsTheExportFormat()
    {
        var exported = ConsumptionCsvWriter.Write(
        [
            new ConsumptionResponse(
                Guid.NewGuid(),
                "January reading",
                "Line one, line two",
                1234.56m,
                ConsumptionValueType.Absolute,
                true,
                12.34m,
                new ConsumptionResourceResponse(Guid.NewGuid(), "Electricity", "kWh", "#fff", "zap"),
                new DateTime(2026, 1, 31, 0, 0, 0, DateTimeKind.Utc))
        ]);

        var result = ConsumptionCsvReader.Read(exported);

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value.Errors).IsEmpty();
        var row = result.Value.Rows.Single();
        await Assert.That(row.RowNumber).IsEqualTo(2);
        await Assert.That(row.Date).IsEqualTo(new DateTime(2026, 1, 31, 0, 0, 0, DateTimeKind.Utc));
        await Assert.That(row.Name).IsEqualTo("January reading");
        await Assert.That(row.Resource).IsEqualTo("Electricity");
        await Assert.That(row.Unit).IsEqualTo("kWh");
        await Assert.That(row.ValueType).IsEqualTo(ConsumptionValueType.Absolute);
        await Assert.That(row.Value).IsEqualTo(1234.56m);
        await Assert.That(row.StartsNewMeterSegment).IsTrue();
        await Assert.That(row.Description).IsEqualTo("Line one, line two");
    }

    [Test]
    public async Task ReadsSpreadsheetVariantsWithSemicolonsDecimalCommasAndGermanDates()
    {
        var result = ConsumptionCsvReader.Read(Csv("date;resource;value\n31.01.2026;Gas;12,5\n"));

        await Assert.That(result.IsSuccess).IsTrue();
        var row = result.Value.Rows.Single();
        await Assert.That(row.Date).IsEqualTo(new DateTime(2026, 1, 31, 0, 0, 0, DateTimeKind.Utc));
        await Assert.That(row.Value).IsEqualTo(12.5m);
        await Assert.That(row.ValueType).IsEqualTo(ConsumptionValueType.Absolute);
        await Assert.That(row.Name).IsNull();
        await Assert.That(row.Unit).IsNull();
    }

    [Test]
    public async Task ReportsUnreadableRowsWithTheirRowNumber()
    {
        var result = ConsumptionCsvReader.Read(Csv(
            "Date,Resource,Value,ValueType\n" +
            "2026-01-31,Gas,10,Relative\n" +
            "31/01/2026,,1.234,5,Monthly\n" +
            "2026-02-28,Gas,-3,\n"));

        await Assert.That(result.IsSuccess).IsTrue();
        await Assert.That(result.Value.Rows.Count).IsEqualTo(1);
        await Assert.That(result.Value.Errors.Select(error => error.RowNumber)).IsEquivalentTo([3, 4]);
        var errors = result.Value.Errors[0].Errors;
        await Assert.That(errors).Contains("Date must have the format yyyy-MM-dd");
        await Assert.That(errors).Contains("Resource is missing");
        await Assert.That(result.Value.Errors[1].Errors).Contains("Value must be a positive number");
    }

    [Test]
    public async Task ReadsMeterReplacementsAndRejectsThemForRelativeValues()
    {
        var result = ConsumptionCsvReader.Read(Csv(
            "Date,Resource,ValueType,Value,StartsNewMeterSegment\n" +
            "2026-01-31,Gas,Absolute,5,TRUE\n" +
            "2026-02-28,Gas,Absolute,15,\n" +
            "2026-03-31,Gas,Relative,3,true\n" +
            "2026-04-30,Gas,Absolute,20,yes\n"));

        await Assert.That(result.Value.Rows.Select(row => row.StartsNewMeterSegment)).IsEquivalentTo([true, false]);
        await Assert.That(result.Value.Errors[0].RowNumber).IsEqualTo(4);
        await Assert.That(result.Value.Errors[0].Errors).IsEqualTo("StartsNewMeterSegment requires an Absolute meter reading");
        await Assert.That(result.Value.Errors[1].Errors).IsEqualTo("StartsNewMeterSegment must be true or false");
    }

    [Test]
    public async Task RejectsAFileWithoutTheRequiredColumns()
    {
        var result = ConsumptionCsvReader.Read(Csv("Date,Name\n2026-01-31,Reading\n"));

        await Assert.That(result.IsError).IsTrue();
        await Assert.That(result.Error.Type).IsEqualTo(ErrorType.Validation);
        await Assert.That(result.Error.Description).IsEqualTo("The file is missing the columns Resource, Value");
    }

    [Test]
    public async Task RejectsAFileWithOnlyAHeader()
    {
        var result = ConsumptionCsvReader.Read(ConsumptionCsvWriter.Write([]));

        await Assert.That(result.IsError).IsTrue();
        await Assert.That(result.Error.Description).IsEqualTo("The file contains no consumptions");
    }

    [Test]
    public async Task RejectsTooManyRows()
    {
        var csv = new StringBuilder("Date,Resource,Value\n");
        for (var index = 0; index <= ConsumptionImportLimits.MaxRows; index++)
        {
            csv.Append("2026-01-31,Gas,1\n");
        }

        var result = ConsumptionCsvReader.Read(Csv(csv.ToString()));

        await Assert.That(result.IsError).IsTrue();
        await Assert.That(result.Error.Description).Contains(ConsumptionImportLimits.MaxRows.ToString(System.Globalization.CultureInfo.InvariantCulture));
    }

    private static byte[] Csv(string text) => Encoding.UTF8.GetBytes(text);
}
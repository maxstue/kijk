using System.Text;
using Kijk.Application.Consumptions.Export;
using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.Entities;

namespace Kijk.IntegrationTests.Application;

public class ConsumptionCsvWriterTests
{
    [Test]
    public async Task WriteProducesSafeInvariantCsvWithBom()
    {
        var consumption = new ConsumptionResponse(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            "=SUM(A1:A2)",
            "Line one, line two",
            1234.56m,
            ConsumptionValueType.Relative,
            false,
            12.34m,
            new ConsumptionResourceResponse(Guid.NewGuid(), "Electricity", "kWh", "#fff", "zap"),
            new DateTime(2026, 9, 11, 0, 0, 0, DateTimeKind.Utc));

        var content = ConsumptionCsvWriter.Write([consumption]);
        var preamble = Encoding.UTF8.GetPreamble();
        var csv = Encoding.UTF8.GetString(content.AsSpan(preamble.Length));

        await Assert.That(content.AsSpan(0, preamble.Length).SequenceEqual(preamble)).IsTrue();
        await Assert.That(csv).Contains("Date,Name,Resource,Unit,ValueType,Value,CalculatedConsumption,Description");
        await Assert.That(csv).Contains("2026-09-11,'=SUM(A1:A2),Electricity,kWh,Relative,1234.56,12.34,\"Line one, line two\"");
        await Assert.That(csv).Contains("\r\n");
    }

    [Test]
    public async Task WriteWithoutConsumptionsProducesHeaderOnly()
    {
        var content = ConsumptionCsvWriter.Write([]);
        var csv = Encoding.UTF8.GetString(content.AsSpan(Encoding.UTF8.GetPreamble().Length));

        await Assert.That(csv.TrimEnd()).IsEqualTo("Date,Name,Resource,Unit,ValueType,Value,CalculatedConsumption,Description");
    }
}

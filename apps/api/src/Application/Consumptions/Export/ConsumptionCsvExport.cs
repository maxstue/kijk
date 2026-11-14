using System.Globalization;
using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Shared.Csv;
using nietras.SeparatedValues;

namespace Kijk.Application.Consumptions.Export;

/// <summary>
/// A generated consumption CSV file.
/// </summary>
/// <param name="Content">The UTF-8 encoded CSV content.</param>
/// <param name="FileName">The suggested download file name.</param>
public sealed record ConsumptionCsvExport(byte[] Content, string FileName);

/// <summary>
/// Serializes consumption records to the public CSV export format.
/// </summary>
public static class ConsumptionCsvWriter
{
    /// <summary>
    /// Serializes the supplied consumptions to UTF-8 CSV.
    /// </summary>
    /// <param name="consumptions">The consumptions to serialize.</param>
    /// <returns>The encoded CSV content.</returns>
    public static byte[] Write(IEnumerable<ConsumptionResponse> consumptions)
    {
        var writer = Sep.New(',').Writer(options => options with { Escape = true }).ToText();
        writer.Header.Add(
            ConsumptionCsvColumns.Date,
            ConsumptionCsvColumns.Name,
            ConsumptionCsvColumns.Resource,
            ConsumptionCsvColumns.Unit,
            ConsumptionCsvColumns.ValueType,
            ConsumptionCsvColumns.Value,
            ConsumptionCsvColumns.StartsNewMeterSegment,
            ConsumptionCsvColumns.CalculatedConsumption,
            ConsumptionCsvColumns.Description);

        foreach (var consumption in consumptions)
        {
            using var row = writer.NewRow();
            row[ConsumptionCsvColumns.Date].Set(consumption.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            row[ConsumptionCsvColumns.Name].Set(SanitizeText(consumption.Name));
            row[ConsumptionCsvColumns.Resource].Set(SanitizeText(consumption.Resource.Name));
            row[ConsumptionCsvColumns.Unit].Set(SanitizeText(consumption.Resource.Unit));
            row[ConsumptionCsvColumns.ValueType].Set(consumption.ValueType.ToString());
            row[ConsumptionCsvColumns.Value].Set(consumption.Value.ToString(CultureInfo.InvariantCulture));
            row[ConsumptionCsvColumns.StartsNewMeterSegment].Set(consumption.StartsNewMeterSegment ? "true" : "false");
            row[ConsumptionCsvColumns.CalculatedConsumption].Set(consumption.CalculatedConsumption.ToString(CultureInfo.InvariantCulture));
            row[ConsumptionCsvColumns.Description].Set(SanitizeText(consumption.Description));
        }

        writer.Dispose();
        return CsvFiles.Encode(writer.ToString());
    }

    private static string SanitizeText(string? value) => CsvFiles.SanitizeText(value);
}
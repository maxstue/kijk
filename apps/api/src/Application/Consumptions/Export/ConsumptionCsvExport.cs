using System.Globalization;
using System.Text;
using Kijk.Application.Consumptions.Shared;
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
    private static readonly UTF8Encoding Utf8WithBom = new(encoderShouldEmitUTF8Identifier: true);

    /// <summary>
    /// Serializes the supplied consumptions to UTF-8 CSV.
    /// </summary>
    /// <param name="consumptions">The consumptions to serialize.</param>
    /// <returns>The encoded CSV content.</returns>
    public static byte[] Write(IEnumerable<ConsumptionResponse> consumptions)
    {
        var writer = Sep.New(',').Writer(options => options with { Escape = true }).ToText();
        writer.Header.Add(
            "Date",
            "Name",
            "Resource",
            "Unit",
            "ValueType",
            "Value",
            "CalculatedConsumption",
            "Description");

        foreach (var consumption in consumptions)
        {
            using var row = writer.NewRow();
            row["Date"].Set(consumption.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            row["Name"].Set(SanitizeText(consumption.Name));
            row["Resource"].Set(SanitizeText(consumption.Resource.Name));
            row["Unit"].Set(SanitizeText(consumption.Resource.Unit));
            row["ValueType"].Set(consumption.ValueType.ToString());
            row["Value"].Set(consumption.Value.ToString(CultureInfo.InvariantCulture));
            row["CalculatedConsumption"].Set(consumption.CalculatedConsumption.ToString(CultureInfo.InvariantCulture));
            row["Description"].Set(SanitizeText(consumption.Description));
        }

        writer.Dispose();
        var csv = Utf8WithBom.GetBytes(writer.ToString().ReplaceLineEndings("\r\n"));
        var preamble = Utf8WithBom.GetPreamble();
        var content = new byte[preamble.Length + csv.Length];
        preamble.CopyTo(content, 0);
        csv.CopyTo(content, preamble.Length);
        return content;
    }

    private static string SanitizeText(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        var trimmed = value.AsSpan().TrimStart();
        return !trimmed.IsEmpty && trimmed[0] is '=' or '+' or '-' or '@' ? $"'{value}" : value;
    }
}
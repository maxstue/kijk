using nietras.SeparatedValues;

namespace Kijk.Application.Imports.Csv;

/// <summary>
/// A bank export split into records. Records may have different column counts, because many banks put metadata lines
/// above the actual table.
/// </summary>
/// <param name="Records">All non-empty records in file order.</param>
public sealed record CsvTable(IReadOnlyList<CsvRecord> Records)
{
    /// <summary>Splits text into records.</summary>
    /// <param name="text">The decoded file content.</param>
    /// <param name="delimiter">The field delimiter.</param>
    /// <param name="maxRecords">An optional limit, e.g. for detection on the first lines.</param>
    /// <returns>The table.</returns>
    public static CsvTable Read(string text, char delimiter, int? maxRecords = null)
    {
        var records = new List<CsvRecord>();
        using var reader = Sep.New(delimiter)
            .Reader(options => options with { HasHeader = false, Unescape = true, DisableColCountCheck = true, Trim = SepTrim.All })
            .FromText(text);
        foreach (var row in reader)
        {
            var fields = new string[row.ColCount];
            for (var index = 0; index < fields.Length; index++)
            {
                fields[index] = row[index].ToString();
            }

            if (fields.All(string.IsNullOrWhiteSpace))
            {
                continue;
            }

            records.Add(new CsvRecord(row.RowIndex + 1, fields));
            if (records.Count == maxRecords)
            {
                break;
            }
        }

        return new CsvTable(records);
    }
}

/// <summary>
/// A record of a bank export.
/// </summary>
/// <param name="RowNumber">The 1-based record number in the file.</param>
/// <param name="Fields">The field values.</param>
public sealed record CsvRecord(int RowNumber, string[] Fields)
{
    /// <summary>Gets a field, or <see langword="null" /> when the column is missing or blank.</summary>
    /// <param name="column">The 0-based column index.</param>
    /// <returns>The trimmed value.</returns>
    public string? Get(int? column) =>
        column is { } index && index >= 0 && index < Fields.Length && !string.IsNullOrWhiteSpace(Fields[index])
            ? Fields[index].Trim()
            : null;
}
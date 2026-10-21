namespace Kijk.Application.Imports.Csv;

/// <summary>
/// Detects delimiter and header row of a bank export. The table is the widest run of consecutive records with the
/// same column count; metadata lines above it (account, period, balance) are narrower.
/// </summary>
public static class CsvFormatDetector
{
    private const int DetectionRecords = 60;

    /// <summary>Detects the delimiter: the one that yields the largest table.</summary>
    /// <param name="text">The decoded file content.</param>
    /// <returns>The delimiter.</returns>
    public static char DetectDelimiter(string text) =>
        CsvImportMapping.Delimiters
            .Select(value => value[0])
            .MaxBy(delimiter => FindTable(CsvTable.Read(text, delimiter, DetectionRecords)) is { } table ? table.Width * table.Length : 0);

    /// <summary>Detects the header row: the first record of the widest run with at least two records.</summary>
    /// <param name="table">The first records of the file.</param>
    /// <returns>The 0-based index of the header record, or -1 when the file has no table.</returns>
    public static int DetectHeaderRow(CsvTable table) => FindTable(table)?.Start ?? -1;

    private static (int Start, int Length, int Width)? FindTable(CsvTable table)
    {
        var records = table.Records;
        (int Start, int Length, int Width)? best = null;
        for (var start = 0; start < records.Count;)
        {
            var width = records[start].Fields.Length;
            var end = start + 1;
            while (end < records.Count && records[end].Fields.Length == width)
            {
                end++;
            }

            var length = end - start;
            if (width > 1 && length >= 2 && (best is null || width > best.Value.Width || width == best.Value.Width && length > best.Value.Length))
            {
                best = (start, length, width);
            }

            start = end;
        }

        return best;
    }
}
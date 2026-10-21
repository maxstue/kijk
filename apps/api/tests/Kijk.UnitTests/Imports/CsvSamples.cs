using Kijk.Application.Imports.Csv;

namespace Kijk.UnitTests.Imports;

/// <summary>Loads the synthetic bank exports next to the test assembly.</summary>
internal static class CsvSamples
{
    internal static byte[] Read(string name) => File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "Imports", "Samples", name));

    /// <summary>Detects the format like the import job and suggests a mapping.</summary>
    internal static (CsvTable Table, CsvImportMapping Mapping) Detect(string name)
    {
        var content = Read(name);
        var encoding = CsvDecoder.DetectEncoding(content);
        var text = CsvDecoder.Decode(content, encoding);
        var delimiter = CsvFormatDetector.DetectDelimiter(text);
        var table = CsvTable.Read(text, delimiter);
        var header = CsvFormatDetector.DetectHeaderRow(table);
        var mapping = MappingSuggester.Suggest(table, delimiter, encoding, header)
                      ?? throw new InvalidOperationException($"No mapping suggested for {name}");
        return (table, mapping);
    }
}
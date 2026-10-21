namespace Kijk.Application.Imports.Csv;

/// <summary>
/// Checks a mapping against the structure of a file and against its first rows.
/// </summary>
public static class MappingValidator
{
    /// <summary>The number of rows below the header that every mapping must parse.</summary>
    public const int SampleSize = 50;

    /// <summary>Validates a mapping.</summary>
    /// <param name="mapping">The mapping.</param>
    /// <param name="table">All records of the file, decoded with the mapping's encoding and delimiter.</param>
    /// <returns>Content-free error messages; empty when the mapping is usable.</returns>
    public static List<string> Validate(CsvImportMapping mapping, CsvTable table)
    {
        var errors = ValidateStructure(mapping, table);
        if (errors.Count > 0)
        {
            return errors;
        }

        foreach (var record in table.Records.Skip(mapping.HeaderRowIndex + 1).Take(SampleSize))
        {
            var parsed = CsvRowParser.Parse(record, mapping);
            errors.AddRange(parsed.Errors.Select(error => $"Row {record.RowNumber}: {error}"));
        }

        return errors;
    }

    private static List<string> ValidateStructure(CsvImportMapping mapping, CsvTable table)
    {
        var errors = new List<string>();
        if (!CsvImportMapping.Delimiters.Contains(mapping.Delimiter))
        {
            errors.Add("The delimiter is not supported");
        }

        if (!CsvImportMapping.Encodings.Contains(mapping.Encoding))
        {
            errors.Add("The encoding is not supported");
        }

        if (!CsvImportMapping.DateFormats.Contains(mapping.DateFormat))
        {
            errors.Add("The date format is not supported");
        }

        if (mapping.DecimalSeparator is not ("," or "."))
        {
            errors.Add("The decimal separator must be ',' or '.'");
        }

        if (mapping.HeaderRowIndex < 0 || mapping.HeaderRowIndex >= table.Records.Count)
        {
            errors.Add("The header row does not exist");
            return errors;
        }

        if (mapping.AmountColumn is null && mapping.DebitColumn is null && mapping.CreditColumn is null)
        {
            errors.Add("Map an amount column, or debit and credit columns");
        }

        var columnCount = table.Records[mapping.HeaderRowIndex].Fields.Length;
        var columns = mapping.MappedColumns.ToList();
        if (columns.Any(column => column < 0 || column >= columnCount))
        {
            errors.Add("A mapped column does not exist");
        }

        if (columns.Count != columns.Distinct().Count())
        {
            errors.Add("A column is mapped more than once");
        }

        return errors;
    }
}
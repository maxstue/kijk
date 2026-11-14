using System.Globalization;
using Kijk.Application.Consumptions.Shared;
using Kijk.Application.Shared.Csv;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Consumptions.Import;

/// <summary>
/// A readable row of a consumption CSV file; the resource is resolved later against the active space.
/// </summary>
/// <param name="RowNumber">The record number in the file.</param>
/// <param name="Date">The UTC calendar day.</param>
/// <param name="Name">The display name, or <see langword="null" /> to use the resource name.</param>
/// <param name="Resource">The resource name.</param>
/// <param name="Unit">The unit symbol, or <see langword="null" /> when the resource name is unique.</param>
/// <param name="ValueType">Whether <paramref name="Value" /> is a meter reading or the consumed amount.</param>
/// <param name="Value">The entered value.</param>
/// <param name="StartsNewMeterSegment">Whether the meter reading starts a new meter segment.</param>
/// <param name="Description">An optional description.</param>
public sealed record ConsumptionCsvRow(
    int RowNumber,
    DateTime Date,
    string? Name,
    string Resource,
    string? Unit,
    ConsumptionValueType ValueType,
    decimal Value,
    bool StartsNewMeterSegment,
    string? Description);

/// <summary>
/// The content of a consumption CSV file.
/// </summary>
/// <param name="Rows">The readable rows.</param>
/// <param name="Errors">The rows that could not be read.</param>
public sealed record ConsumptionCsvContent(IReadOnlyList<ConsumptionCsvRow> Rows, IReadOnlyList<CsvRowErrorResponse> Errors);

/// <summary>
/// Reads the consumption CSV format that <see cref="Export.ConsumptionCsvWriter" /> writes. Spreadsheet variants are
/// accepted as well: semicolons as delimiter, decimal commas and <c>dd.MM.yyyy</c> dates.
/// </summary>
public static class ConsumptionCsvReader
{
    private static readonly string[] DateFormats = ["yyyy-MM-dd", "dd.MM.yyyy"];
    private static readonly string[] RequiredColumns = [ConsumptionCsvColumns.Date, ConsumptionCsvColumns.Resource, ConsumptionCsvColumns.Value];

    /// <summary>Reads all rows of a file.</summary>
    /// <param name="content">The file content.</param>
    /// <returns>The rows and row errors, or a validation error when the file has no usable table.</returns>
    public static Result<ConsumptionCsvContent> Read(byte[] content)
    {
        var text = CsvDecoder.Decode(content, CsvDecoder.DetectEncoding(content));
        var table = CsvTable.Read(text, DetectDelimiter(text));
        if (table.Records.Count == 0)
        {
            return Error.Validation("The file is empty");
        }

        var columns = table.Records[0].Fields
            .Select((name, index) => (Name: name.Trim(), Index: index))
            .Where(column => column.Name.Length > 0)
            .GroupBy(column => column.Name, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First().Index, StringComparer.OrdinalIgnoreCase);
        var missing = RequiredColumns.Where(column => !columns.ContainsKey(column)).ToList();
        if (missing.Count > 0)
        {
            return Error.Validation($"The file is missing the columns {string.Join(", ", missing)}");
        }

        var records = table.Records.Skip(1).ToList();
        if (records.Count == 0)
        {
            return Error.Validation("The file contains no consumptions");
        }

        if (records.Count > ConsumptionImportLimits.MaxRows)
        {
            return Error.Validation($"The file must not contain more than {ConsumptionImportLimits.MaxRows} rows");
        }

        var rows = new List<ConsumptionCsvRow>();
        var errors = new List<CsvRowErrorResponse>();
        foreach (var record in records)
        {
            var row = ReadRow(record, columns, out var rowErrors);
            if (row is null)
            {
                errors.Add(new CsvRowErrorResponse(record.RowNumber, string.Join("; ", rowErrors)));
            }
            else
            {
                rows.Add(row);
            }
        }

        return new ConsumptionCsvContent(rows, errors);
    }

    private static ConsumptionCsvRow? ReadRow(CsvRecord record, Dictionary<string, int> columns, out List<string> errors)
    {
        errors = [];
        string? Get(string column) => columns.TryGetValue(column, out var index) ? record.Get(index) : null;

        var date = ParseDate(Get(ConsumptionCsvColumns.Date), errors);
        var value = ParseValue(Get(ConsumptionCsvColumns.Value), errors);
        var valueType = ParseValueType(Get(ConsumptionCsvColumns.ValueType), errors);
        var startsNewMeterSegment = ParseStartsNewMeterSegment(Get(ConsumptionCsvColumns.StartsNewMeterSegment), errors);
        if (startsNewMeterSegment is true && valueType == ConsumptionValueType.Relative)
        {
            errors.Add($"{ConsumptionCsvColumns.StartsNewMeterSegment} requires an {nameof(ConsumptionValueType.Absolute)} meter reading");
        }

        var resource = Get(ConsumptionCsvColumns.Resource);
        if (resource is null)
        {
            errors.Add($"{ConsumptionCsvColumns.Resource} is missing");
        }

        var description = Get(ConsumptionCsvColumns.Description);
        if (description?.Length > ConsumptionValidationRules.DescriptionMaximumLength)
        {
            errors.Add($"{ConsumptionCsvColumns.Description} must not be longer than {ConsumptionValidationRules.DescriptionMaximumLength} characters");
        }

        if (errors.Count > 0 || date is null || value is null || valueType is null || startsNewMeterSegment is null || resource is null)
        {
            return null;
        }

        return new ConsumptionCsvRow(
            record.RowNumber,
            date.Value,
            Get(ConsumptionCsvColumns.Name),
            resource,
            Get(ConsumptionCsvColumns.Unit),
            valueType.Value,
            value.Value,
            startsNewMeterSegment.Value,
            description);
    }

    private static DateTime? ParseDate(string? value, List<string> errors)
    {
        if (value is null)
        {
            errors.Add($"{ConsumptionCsvColumns.Date} is missing");
            return null;
        }

        if (!DateTime.TryParseExact(value, DateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            errors.Add($"{ConsumptionCsvColumns.Date} must have the format yyyy-MM-dd");
            return null;
        }

        return new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc);
    }

    // Accepts a decimal point or a decimal comma, but no thousands separators, so "1.234" is never ambiguous.
    private static decimal? ParseValue(string? value, List<string> errors)
    {
        if (value is null)
        {
            errors.Add($"{ConsumptionCsvColumns.Value} is missing");
            return null;
        }

        if (value.Contains('.') && value.Contains(',')
            || !decimal.TryParse(value.Replace(',', '.'), NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var number))
        {
            errors.Add($"{ConsumptionCsvColumns.Value} must be a positive number without thousands separators");
            return null;
        }

        return number;
    }

    private static ConsumptionValueType? ParseValueType(string? value, List<string> errors)
    {
        if (value is null)
        {
            return ConsumptionValueType.Absolute;
        }

        if (!Enum.TryParse<ConsumptionValueType>(value, ignoreCase: true, out var valueType) || !Enum.IsDefined(valueType))
        {
            errors.Add($"{ConsumptionCsvColumns.ValueType} must be {nameof(ConsumptionValueType.Absolute)} or {nameof(ConsumptionValueType.Relative)}");
            return null;
        }

        return valueType;
    }

    private static bool? ParseStartsNewMeterSegment(string? value, List<string> errors)
    {
        if (value is null)
        {
            return false;
        }

        if (!bool.TryParse(value, out var startsNewMeterSegment))
        {
            errors.Add($"{ConsumptionCsvColumns.StartsNewMeterSegment} must be true or false");
            return null;
        }

        return startsNewMeterSegment;
    }

    // The export uses commas; spreadsheet apps with German settings save semicolons.
    private static char DetectDelimiter(string text)
    {
        var header = text.AsSpan(0, text.IndexOfAny(['\r', '\n']) is var end and >= 0 ? end : text.Length);
        return header.Count(';') > header.Count(',') ? ';' : ',';
    }
}
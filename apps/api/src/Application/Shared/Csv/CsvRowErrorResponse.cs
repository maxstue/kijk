namespace Kijk.Application.Shared.Csv;

/// <summary>A bounded error preview of an uploaded CSV file without the original row content.</summary>
/// <param name="RowNumber">The record number in the file.</param>
/// <param name="Errors">Why the record could not be read or imported.</param>
public sealed record CsvRowErrorResponse(int RowNumber, string Errors);
using System.Text.Json;
using Kijk.Application.Imports.Csv;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Imports.Shared;

/// <summary>The state of an import.</summary>
/// <param name="Id">The import id.</param>
/// <param name="Status">The processing state.</param>
/// <param name="FileName">The uploaded file name.</param>
/// <param name="AccountId">The bank account.</param>
/// <param name="AccountName">The bank account name.</param>
/// <param name="RowCount">The number of data rows.</param>
/// <param name="ProcessedRows">The number of rows read so far.</param>
/// <param name="ErrorCount">The number of rows that could not be parsed.</param>
/// <param name="ImportedCount">The number of transactions created by the commit.</param>
/// <param name="HasHighErrorRate">Whether committing needs an explicit confirmation because too many rows failed.</param>
/// <param name="Error">Why the import failed, without file content.</param>
/// <param name="ProposedMapping">The proposed mapping, while the import waits for one.</param>
/// <param name="ProposedMappingSource">Where the proposal came from.</param>
/// <param name="AiUnavailable">Whether the AI format detection could not be reached, so a weaker proposal is shown.</param>
/// <param name="AiDataSharing">Which data the AI categorization of this import may see.</param>
/// <param name="AiCategorizedCount">The number of rows the AI categorized in the last run.</param>
/// <param name="AiCategorizationUnavailable">Whether the AI could not be reached, so some rows stay uncategorized.</param>
/// <param name="Mapping">The confirmed mapping.</param>
/// <param name="FullMonths">Months the file covers completely; committing replaces them.</param>
/// <param name="EdgeMonths">The first and last month, which the file may cover only partly.</param>
/// <param name="ReplacedMonths">Months replaced by the commit.</param>
/// <param name="SkippedMonths">Edge months the user did not import.</param>
/// <param name="CreatedAt">When the file was uploaded.</param>
/// <param name="CompletedAt">When the import was committed, cancelled or failed.</param>
public sealed record ImportJobResponse(
    Guid Id,
    ImportJobStatus Status,
    string FileName,
    Guid AccountId,
    string AccountName,
    int RowCount,
    int ProcessedRows,
    int ErrorCount,
    int ImportedCount,
    bool HasHighErrorRate,
    string? Error,
    CsvImportMapping? ProposedMapping,
    MappingSource? ProposedMappingSource,
    bool AiUnavailable,
    AiDataSharing AiDataSharing,
    int AiCategorizedCount,
    bool AiCategorizationUnavailable,
    CsvImportMapping? Mapping,
    List<DateOnly> FullMonths,
    List<DateOnly> EdgeMonths,
    List<DateOnly> ReplacedMonths,
    List<DateOnly> SkippedMonths,
    DateTime CreatedAt,
    DateTime? CompletedAt);

/// <summary>The first rows of an uploaded file, for choosing the column mapping.</summary>
/// <param name="Encoding">The encoding used to decode the file.</param>
/// <param name="Delimiter">The delimiter used to split it.</param>
/// <param name="HeaderRowIndex">The index of the header among the non-empty records.</param>
/// <param name="Headers">The header fields.</param>
/// <param name="Rows">The first data rows.</param>
/// <param name="RecordCount">The number of non-empty records in the file.</param>
public sealed record ImportPreviewResponse(
    string Encoding,
    string Delimiter,
    int HeaderRowIndex,
    List<string> Headers,
    List<List<string>> Rows,
    int RecordCount);

/// <summary>A row of an import waiting for review.</summary>
/// <param name="Id">The candidate id.</param>
/// <param name="RowNumber">The record number in the file.</param>
/// <param name="BookingDate">The booking date, if valid.</param>
/// <param name="Amount">The signed amount, if valid.</param>
/// <param name="Counterparty">The counterparty.</param>
/// <param name="Purpose">The cleaned purpose.</param>
/// <param name="Status">Whether the booking is booked or pending.</param>
/// <param name="CategoryId">The proposed or chosen category.</param>
/// <param name="CategorySource">How the category was found.</param>
/// <param name="Errors">Why the row could not be parsed.</param>
/// <param name="Excluded">Whether the row will not be imported.</param>
/// <param name="IsCardSettlement">Whether the row looks like a credit card statement.</param>
/// <param name="CountsAsOffset">Whether the card statement only offsets separately imported purchases.</param>
public sealed record ImportCandidateResponse(
    Guid Id,
    int RowNumber,
    DateOnly? BookingDate,
    decimal? Amount,
    string? Counterparty,
    string? Purpose,
    TransactionStatus Status,
    Guid? CategoryId,
    CategorySource? CategorySource,
    string? Errors,
    bool Excluded,
    bool IsCardSettlement,
    bool CountsAsOffset);

/// <summary>The import settings of the active household.</summary>
/// <param name="PurposeRetention">How much of the purpose text imported transactions keep.</param>
/// <param name="AiDataSharing">Which transaction data the AI categorization may see.</param>
/// <param name="MinimizeData">Whether imports store neither names of private persons nor counterparty keys.</param>
public sealed record ImportSettingsResponse(PurposeRetention PurposeRetention, AiDataSharing AiDataSharing, bool MinimizeData);

/// <summary>A distinct text the AI categorization would send.</summary>
/// <param name="Key">The id of the text within the import.</param>
/// <param name="Counterparty">The counterparty as sent.</param>
/// <param name="Purpose">The purpose as sent.</param>
/// <param name="Incoming">Whether money came in; the amount itself is never sent.</param>
/// <param name="RowCount">The number of rows that share the text.</param>
/// <param name="Excluded">Whether the user deselected the text.</param>
public sealed record AiPreviewItemResponse(string Key, string? Counterparty, string? Purpose, bool Incoming, int RowCount, bool Excluded);

/// <summary>What the AI categorization of an import would send.</summary>
/// <param name="Items">The distinct texts.</param>
/// <param name="WithheldRows">Rows without a category that are not sent because nothing useful remains after cleaning.</param>
public sealed record AiPreviewResponse(List<AiPreviewItemResponse> Items, int WithheldRows);

/// <summary>
/// Maps import entities to API responses and serializes mappings.
/// </summary>
public static class ImportMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Serializes a mapping for storage.</summary>
    /// <param name="mapping">The mapping.</param>
    /// <returns>The JSON.</returns>
    public static string Serialize(CsvImportMapping mapping) => JsonSerializer.Serialize(mapping, JsonOptions);

    /// <summary>Deserializes a stored mapping.</summary>
    /// <param name="json">The JSON, if any.</param>
    /// <returns>The mapping, or <see langword="null" />.</returns>
    public static CsvImportMapping? Deserialize(string? json) =>
        json is null ? null : JsonSerializer.Deserialize<CsvImportMapping>(json, JsonOptions);

    /// <summary>Maps an import with its loaded account.</summary>
    /// <param name="source">The import.</param>
    /// <returns>The response.</returns>
    public static ImportJobResponse ToResponse(this ImportJob source) =>
        new(
            source.Id,
            source.Status,
            source.FileName,
            source.AccountId,
            source.Account.Name,
            source.RowCount,
            source.ProcessedRows,
            source.ErrorCount,
            source.ImportedCount,
            source.HasHighErrorRate,
            source.Error,
            Deserialize(source.ProposedMapping),
            source.ProposedMappingSource,
            source.AiUnavailable,
            source.AiDataSharing,
            source.AiCategorizedCount,
            source.AiCategorizationUnavailable,
            Deserialize(source.Mapping),
            ToDates(source.FullMonths),
            ToDates(source.EdgeMonths),
            ToDates(source.ReplacedMonths),
            ToDates(source.SkippedMonths),
            source.CreatedAt,
            source.CompletedAt);

    /// <summary>Maps a candidate.</summary>
    /// <param name="source">The candidate.</param>
    /// <returns>The response.</returns>
    public static ImportCandidateResponse ToResponse(this ImportCandidate source) =>
        new(
            source.Id,
            source.RowNumber,
            source.BookingDate is { } date ? DateOnly.FromDateTime(date) : null,
            source.Amount,
            source.Counterparty,
            source.Purpose,
            source.Status,
            source.CategoryId,
            source.CategorySource,
            source.Errors,
            source.Excluded,
            source.IsCardSettlement,
            source.CountsAsOffset);

    private static List<DateOnly> ToDates(IEnumerable<DateTime> months) => [.. months.Order().Select(DateOnly.FromDateTime)];
}
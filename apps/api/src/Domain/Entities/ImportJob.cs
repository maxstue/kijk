using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// A CSV import of one bank account. The job walks through analysis, mapping, reading and review; after it is done only
/// this lean record without any file content remains.
/// </summary>
public sealed class ImportJob : BaseEntity
{
    /// <summary>The maximum share of rows that may fail to parse before committing needs an explicit confirmation.</summary>
    public const decimal MaximumErrorRate = 0.05m;

    /// <summary>Gets the processing state.</summary>
    public ImportJobStatus Status { get; private set; }

    /// <summary>Gets the name of the uploaded file.</summary>
    public required string FileName { get; init; }

    /// <summary>Gets the number of data rows in the file.</summary>
    public int RowCount { get; private set; }

    /// <summary>Gets the number of rows read so far.</summary>
    public int ProcessedRows { get; private set; }

    /// <summary>Gets the number of rows that could not be parsed.</summary>
    public int ErrorCount { get; private set; }

    /// <summary>Gets the number of transactions created when the import was committed.</summary>
    public int ImportedCount { get; private set; }

    /// <summary>Gets a short, content-free description of why the import failed.</summary>
    public string? Error { get; private set; }

    /// <summary>Gets the proposed column mapping as JSON, until the user confirms one.</summary>
    public string? ProposedMapping { get; private set; }

    /// <summary>Gets where the proposed mapping came from.</summary>
    public MappingSource? ProposedMappingSource { get; private set; }

    /// <summary>Gets whether the AI format detection was allowed but could not be reached, so a weaker proposal is shown.</summary>
    public bool AiUnavailable { get; private set; }

    /// <summary>Gets which data the AI categorization of this import may see.</summary>
    public AiDataSharing AiDataSharing { get; private set; }

    /// <summary>Gets the number of candidates the AI categorized in the last run.</summary>
    public int AiCategorizedCount { get; private set; }

    /// <summary>Gets whether the last AI categorization could not be completed, so some rows stay uncategorized.</summary>
    public bool AiCategorizationUnavailable { get; private set; }

    /// <summary>Gets the confirmed column mapping as JSON.</summary>
    public string? Mapping { get; private set; }

    /// <summary>Gets the months between the first and the last booking; the file covers them completely.</summary>
    public List<DateTime> FullMonths { get; private set; } = [];

    /// <summary>Gets the first and the last month of the file, which it may only cover partly.</summary>
    public List<DateTime> EdgeMonths { get; private set; } = [];

    /// <summary>Gets the months whose transactions were replaced when the import was committed.</summary>
    public List<DateTime> ReplacedMonths { get; private set; } = [];

    /// <summary>Gets the edge months the user chose not to import.</summary>
    public List<DateTime> SkippedMonths { get; private set; } = [];

    /// <summary>Gets the version of the secret key the candidates' keys were computed with.</summary>
    public int KeyVersion { get; private set; }

    /// <summary>Gets when the import was committed, cancelled or failed (UTC).</summary>
    public DateTime? CompletedAt { get; private set; }

    /// <summary>Gets the concurrency token that makes committing idempotent.</summary>
    public uint Version { get; init; }

    /// <summary>Gets or sets the id of <see cref="Account" />.</summary>
    public Guid AccountId { get; set; }

    /// <summary>Gets or sets the bank account the transactions are imported into.</summary>
    public required Account Account { get; set; }

    /// <summary>Gets or sets the id of <see cref="CreatedBy" />.</summary>
    public Guid CreatedById { get; set; }

    /// <summary>Gets or sets the user that started the import.</summary>
    public required User CreatedBy { get; set; }

    /// <summary>
    /// Gets or sets the id of <see cref="Space" />. The job stores it itself because background processing has no
    /// current user.
    /// </summary>
    public Guid SpaceId { get; set; }

    /// <summary>Gets or sets the space the import belongs to.</summary>
    public required Space Space { get; set; }

    /// <summary>Gets whether so many rows failed that committing needs an explicit confirmation.</summary>
    public bool HasHighErrorRate => RowCount > 0 && (decimal)ErrorCount / RowCount > MaximumErrorRate;

    /// <summary>Gets whether the import still waits for processing or a user decision.</summary>
    public bool IsOpen => Status is not (ImportJobStatus.Done or ImportJobStatus.Failed or ImportJobStatus.Cancelled);

    /// <summary>Creates a pending import.</summary>
    /// <param name="fileName">The name of the uploaded file.</param>
    /// <param name="account">The bank account.</param>
    /// <param name="createdBy">The user that started the import.</param>
    /// <param name="space">The owning space.</param>
    /// <returns>The new import.</returns>
    public static ImportJob Create(string fileName, Account account, User createdBy, Space space) =>
        new()
        {
            FileName = fileName,
            Status = ImportJobStatus.Pending,
            Account = account,
            CreatedBy = createdBy,
            Space = space
        };

    /// <summary>Marks the start of the analysis. A retried analysis starts again.</summary>
    /// <returns><see langword="true" /> if the import can be analyzed.</returns>
    public bool StartAnalysis()
    {
        if (Status is not (ImportJobStatus.Pending or ImportJobStatus.Analyzing))
        {
            return false;
        }

        Status = ImportJobStatus.Analyzing;
        return true;
    }

    /// <summary>Stores a proposed mapping and waits for the user's confirmation.</summary>
    /// <param name="mapping">The mapping as JSON, or <see langword="null" /> when nothing could be proposed.</param>
    /// <param name="source">Where the proposal came from.</param>
    /// <param name="aiUnavailable">Whether the AI detection could not be reached.</param>
    public void ProposeMapping(string? mapping, MappingSource? source, bool aiUnavailable = false)
    {
        AiUnavailable = aiUnavailable;
        ProposedMapping = mapping;
        ProposedMappingSource = mapping is null ? null : source;
        Status = ImportJobStatus.NeedsMapping;
    }

    /// <summary>Stores the confirmed mapping and starts reading the whole file.</summary>
    /// <param name="mapping">The mapping as JSON.</param>
    /// <returns><see langword="true" /> if the import was waiting for a mapping.</returns>
    public bool ConfirmMapping(string mapping)
    {
        if (Status is not (ImportJobStatus.NeedsMapping or ImportJobStatus.Analyzing))
        {
            return false;
        }

        Mapping = mapping;
        Status = ImportJobStatus.Reading;
        ProcessedRows = 0;
        return true;
    }

    /// <summary>Starts reading, or starts again after an interrupted read.</summary>
    /// <param name="rowCount">The number of data rows in the file.</param>
    /// <param name="keyVersion">The version of the secret key used for the rows' keys.</param>
    /// <returns><see langword="true" /> if the import can be read.</returns>
    public bool StartReading(int rowCount, int keyVersion)
    {
        if (Status != ImportJobStatus.Reading || Mapping is null)
        {
            return false;
        }

        RowCount = rowCount;
        KeyVersion = keyVersion;
        ProcessedRows = 0;
        ErrorCount = 0;
        return true;
    }

    /// <summary>Records reading progress.</summary>
    /// <param name="processedRows">The number of rows read so far.</param>
    /// <param name="errorCount">The number of rows that failed so far.</param>
    public void ReportProgress(int processedRows, int errorCount)
    {
        ProcessedRows = processedRows;
        ErrorCount = errorCount;
    }

    /// <summary>Finishes reading and waits for the user's review.</summary>
    /// <param name="fullMonths">The months the file covers completely.</param>
    /// <param name="edgeMonths">The first and last month, which the file may only cover partly.</param>
    public void FinishReading(IEnumerable<DateTime> fullMonths, IEnumerable<DateTime> edgeMonths)
    {
        FullMonths = [.. fullMonths];
        EdgeMonths = [.. edgeMonths];
        ProcessedRows = RowCount;
        Status = ImportJobStatus.NeedsReview;
    }

    /// <summary>Starts the AI categorization of the candidates, after reading or on request during the review.</summary>
    /// <param name="sharing">Which data the AI may see.</param>
    /// <returns><see langword="true" /> if the import was waiting for categorization or review.</returns>
    public bool StartCategorizing(AiDataSharing sharing)
    {
        if (Status is not (ImportJobStatus.NeedsReview or ImportJobStatus.Categorizing))
        {
            return false;
        }

        AiDataSharing = sharing;
        AiCategorizedCount = 0;
        AiCategorizationUnavailable = false;
        Status = ImportJobStatus.Categorizing;
        return true;
    }

    /// <summary>Finishes the AI categorization and waits for the user's review.</summary>
    /// <param name="categorizedCount">The number of candidates that received a category.</param>
    /// <param name="unavailable">Whether the AI could not be reached for some of them.</param>
    public void FinishCategorizing(int categorizedCount, bool unavailable)
    {
        AiCategorizedCount = categorizedCount;
        AiCategorizationUnavailable = unavailable;
        Status = ImportJobStatus.NeedsReview;
    }

    /// <summary>Marks the import as committed.</summary>
    /// <param name="replacedMonths">The months whose transactions were replaced.</param>
    /// <param name="skippedMonths">The edge months that were not imported.</param>
    /// <param name="importedCount">The number of created transactions.</param>
    /// <param name="utcNow">The current time.</param>
    public void Complete(IEnumerable<DateTime> replacedMonths, IEnumerable<DateTime> skippedMonths, int importedCount, DateTime utcNow)
    {
        ReplacedMonths = [.. replacedMonths];
        SkippedMonths = [.. skippedMonths];
        ImportedCount = importedCount;
        Status = ImportJobStatus.Done;
        CompletedAt = utcNow;
    }

    /// <summary>Cancels an open import.</summary>
    /// <param name="utcNow">The current time.</param>
    /// <returns><see langword="true" /> if the import was open.</returns>
    public bool Cancel(DateTime utcNow)
    {
        if (!IsOpen)
        {
            return false;
        }

        Status = ImportJobStatus.Cancelled;
        CompletedAt = utcNow;
        return true;
    }

    /// <summary>Marks an open import as failed.</summary>
    /// <param name="error">A short description without any file content.</param>
    /// <param name="utcNow">The current time.</param>
    public void Fail(string error, DateTime utcNow)
    {
        if (!IsOpen)
        {
            return;
        }

        Status = ImportJobStatus.Failed;
        Error = error;
        CompletedAt = utcNow;
    }
}
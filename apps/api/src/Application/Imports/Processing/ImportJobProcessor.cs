using Kijk.Application.Imports.Csv;
using Kijk.Application.Imports.Detection;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Security;
using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Imports.Processing;

/// <summary>
/// Runs the background steps of an import: format analysis and reading the whole file. Both steps can run again after
/// a crash; they never log file content.
/// </summary>
public sealed class ImportJobProcessor(
    IAppDbContext dbContext,
    ImportFileReader fileReader,
    IPseudonymizer pseudonymizer,
    ICsvFormatDetector formatDetector,
    TimeProvider timeProvider,
    ILogger<ImportJobProcessor> logger) : IHandler
{
    private const int BatchSize = 500;
    private const int DetectionRecords = 60;

    /// <summary>
    /// Detects encoding, delimiter and header, then proposes a mapping. A confirmed profile of the same format that
    /// still parses the first rows is applied directly and the file is read without asking again.
    /// </summary>
    /// <param name="importJobId">The import.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the step is done.</returns>
    public async Task AnalyzeAsync(Guid importJobId, CancellationToken cancellationToken)
    {
        var job = await dbContext.ImportJobs.FirstOrDefaultAsync(item => item.Id == importJobId, cancellationToken);
        if (job is null || !job.StartAnalysis())
        {
            return;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        try
        {
            var content = await fileReader.LoadAsync(job.Id, cancellationToken);
            if (content is null)
            {
                await FailAsync(job.Id, "The uploaded file has expired", cancellationToken);
                return;
            }

            var encoding = CsvDecoder.DetectEncoding(content);
            var text = CsvDecoder.Decode(content, encoding);
            var delimiter = CsvFormatDetector.DetectDelimiter(text);
            var table = CsvTable.Read(text, delimiter);
            var headerIndex = CsvFormatDetector.DetectHeaderRow(new CsvTable([.. table.Records.Take(DetectionRecords)]));
            if (headerIndex < 0)
            {
                job.ProposeMapping(null, null);
                await dbContext.SaveChangesAsync(cancellationToken);
                return;
            }

            var fingerprint = HeaderFingerprint.Compute(table.Records[headerIndex].Fields, delimiter.ToString(), encoding);
            var profile = await dbContext.ImportProfiles
                .Where(item => item.HouseholdId == job.HouseholdId && item.HeaderFingerprint == fingerprint)
                .OrderByDescending(item => item.Version)
                .FirstOrDefaultAsync(cancellationToken);
            var profileMapping = ImportMapper.Deserialize(profile?.Mapping);
            if (profile is not null && profileMapping is not null && MappingValidator.Validate(profileMapping, table).Count == 0)
            {
                job.ProposeMapping(profile.Mapping, MappingSource.Profile);
                job.ConfirmMapping(profile.Mapping);
                await dbContext.SaveChangesAsync(cancellationToken);
                await ReadCoreAsync(job, table, profileMapping, cancellationToken);
                return;
            }

            // Only formats without a confirmed profile reach the AI, and it only sees masked patterns.
            var detection = await formatDetector.DetectAsync(job.HouseholdId, table, delimiter, encoding, headerIndex, cancellationToken);
            if (detection.Mapping is { } detected)
            {
                job.ProposeMapping(ImportMapper.Serialize(detected), MappingSource.Ai);
                await dbContext.SaveChangesAsync(cancellationToken);
                return;
            }

            var suggestion = MappingSuggester.Suggest(table, delimiter, encoding, headerIndex);
            job.ProposeMapping(
                suggestion is null ? null : ImportMapper.Serialize(suggestion),
                MappingSource.Suggestion,
                aiUnavailable: detection.Outcome == CsvFormatDetectionOutcome.Unavailable);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            // Only the exception type is logged: messages of parsing exceptions can contain file content.
            logger.LogWarning("Analysis of import {ImportJobId} failed with {ExceptionType}", job.Id, exception.GetType().Name);
            await FailAsync(job.Id, "The file could not be analyzed", cancellationToken);
        }
    }

    /// <summary>Reads the whole file with the confirmed mapping into candidates for the review.</summary>
    /// <param name="importJobId">The import.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the step is done.</returns>
    public async Task ReadAsync(Guid importJobId, CancellationToken cancellationToken)
    {
        var job = await dbContext.ImportJobs.FirstOrDefaultAsync(item => item.Id == importJobId, cancellationToken);
        var mapping = ImportMapper.Deserialize(job?.Mapping);
        if (job is null || mapping is null || job.Status != ImportJobStatus.Reading)
        {
            return;
        }

        try
        {
            var content = await fileReader.LoadAsync(job.Id, cancellationToken);
            if (content is null)
            {
                await FailAsync(job.Id, "The uploaded file has expired", cancellationToken);
                return;
            }

            await ReadCoreAsync(job, ImportFileReader.ReadTable(content, mapping), mapping, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning("Reading import {ImportJobId} failed with {ExceptionType}", job.Id, exception.GetType().Name);
            await FailAsync(job.Id, "The file could not be read", cancellationToken);
        }
    }

    private async Task ReadCoreAsync(ImportJob job, CsvTable table, CsvImportMapping mapping, CancellationToken cancellationToken)
    {
        var records = table.Records.Skip(mapping.HeaderRowIndex + 1).ToList();
        if (records.Count > ImportLimits.MaxRows)
        {
            await FailAsync(job.Id, $"The file has more than {ImportLimits.MaxRows} rows", cancellationToken);
            return;
        }

        job.StartReading(records.Count, pseudonymizer.KeyVersion);
        // A read that was interrupted, e.g. by a restart, starts again from the first row.
        await dbContext.ImportCandidates.Where(item => item.ImportJobId == job.Id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var corrections = await LoadManualCorrectionsAsync(job, cancellationToken);
        var rules = await LoadRulesAsync(job.HouseholdId, cancellationToken);
        var keys = new ImportKeyBuilder(pseudonymizer, job.HouseholdId, job.AccountId);
        var dates = new List<DateTime>();
        var errorCount = 0;

        foreach (var (batch, batchIndex) in records.Chunk(BatchSize).Select((batch, index) => (batch, index)))
        {
            foreach (var record in batch)
            {
                var row = CsvRowParser.Parse(record, mapping);
                if (!row.IsValid)
                {
                    errorCount++;
                    dbContext.ImportCandidates.Add(ImportCandidate.CreateInvalid(job.Id, record.RowNumber, string.Join("; ", row.Errors)));
                    continue;
                }

                dates.Add(row.Date!.Value);
                dbContext.ImportCandidates.Add(CreateCandidate(job.Id, record.RowNumber, row, keys, corrections, rules));
            }

            job.ReportProgress(Math.Min(records.Count, (batchIndex + 1) * BatchSize), errorCount);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var (fullMonths, edgeMonths) = ImportCoverage.Analyze(dates);
        job.FinishReading(fullMonths, edgeMonths);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static ImportCandidate CreateCandidate(
        Guid importJobId,
        int rowNumber,
        ParsedRow row,
        ImportKeyBuilder keys,
        Dictionary<string, Guid> corrections,
        RuleSet rules)
    {
        var (bookingKey, counterpartyKey) = keys.Build(row);
        var candidate = ImportCandidate.CreateValid(importJobId, rowNumber, new ImportCandidateValues(
            row.Date!.Value,
            row.Amount!.Value,
            Truncate(row.Counterparty, 200),
            Truncate(PurposeScrubber.Scrub(row.Purpose), 500),
            row.Status,
            row.IsMerchantPayment,
            bookingKey,
            counterpartyKey));

        if (corrections.TryGetValue(bookingKey, out var correctedCategoryId))
        {
            candidate.ProposeCategory(correctedCategoryId, CategorySource.Manual);
        }
        else if (rules.Find(counterpartyKey, row.Counterparty, row.IsMerchantPayment, candidate.Purpose) is { } ruleCategoryId)
        {
            candidate.ProposeCategory(ruleCategoryId, CategorySource.Rule);
        }

        return candidate;
    }

    private async Task<Dictionary<string, Guid>> LoadManualCorrectionsAsync(ImportJob job, CancellationToken cancellationToken)
    {
        var corrections = await dbContext.Transactions
            .Where(item => item.HouseholdId == job.HouseholdId
                           && item.AccountId == job.AccountId
                           && item.CategorySource == CategorySource.Manual
                           && item.BookingKey != null
                           && item.CategoryId != null)
            .Select(item => new { BookingKey = item.BookingKey!, CategoryId = item.CategoryId!.Value })
            .ToListAsync(cancellationToken);

        return corrections.GroupBy(item => item.BookingKey).ToDictionary(group => group.Key, group => group.First().CategoryId);
    }

    private async Task<RuleSet> LoadRulesAsync(Guid householdId, CancellationToken cancellationToken)
    {
        var rules = await dbContext.CategoryRules
            .Where(item => item.HouseholdId == householdId)
            .OrderBy(item => item.Priority)
            .ThenBy(item => item.CreatedAt)
            .Select(item => new { item.Scope, item.Key, item.CategoryId })
            .ToListAsync(cancellationToken);

        // Later and higher-priority rules overwrite earlier ones.
        var result = new RuleSet();
        foreach (var rule in rules)
        {
            result.Add(rule.Scope, rule.Key, rule.CategoryId);
        }

        return result;
    }

    private async Task FailAsync(Guid importJobId, string error, CancellationToken cancellationToken)
    {
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        await dbContext.ImportCandidates.Where(item => item.ImportJobId == importJobId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.ImportFiles.Where(item => item.ImportJobId == importJobId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.ImportJobs
            .Where(item => item.Id == importJobId
                           && item.Status != ImportJobStatus.Done
                           && item.Status != ImportJobStatus.Cancelled)
            .ExecuteUpdateAsync(setters => setters
                    .SetProperty(item => item.Status, ImportJobStatus.Failed)
                    .SetProperty(item => item.Error, error)
                    .SetProperty(item => item.CompletedAt, utcNow),
                cancellationToken);
    }

    private static string? Truncate(string? value, int maximumLength) =>
        value is { Length: > 0 } && value.Length > maximumLength ? value[..maximumLength] : value;

    private sealed class RuleSet
    {
        private readonly Dictionary<string, Guid> _counterparty = new(StringComparer.Ordinal);
        private readonly Dictionary<string, Guid> _merchant = new(StringComparer.Ordinal);
        private readonly Dictionary<string, Guid> _keyword = new(StringComparer.Ordinal);

        public void Add(CategoryRuleScope scope, string key, Guid categoryId) =>
            (scope switch
            {
                CategoryRuleScope.Counterparty => _counterparty,
                CategoryRuleScope.Merchant => _merchant,
                _ => _keyword
            })[key] = categoryId;

        // Rules for the counterparty or merchant are more specific and win over keyword rules.
        public Guid? Find(string? counterpartyKey, string? counterparty, bool isMerchantPayment, string? purpose) =>
            CategoryRuleKeys.For(counterpartyKey, counterparty, isMerchantPayment) switch
            {
                ({ } scope, var key) when scope == CategoryRuleScope.Counterparty && _counterparty.TryGetValue(key, out var id) => id,
                ({ } scope, var key) when scope == CategoryRuleScope.Merchant && _merchant.TryGetValue(key, out var id) => id,
                _ => FindKeyword(purpose)
            };

        private Guid? FindKeyword(string? purpose)
        {
            if (_keyword.Count == 0)
            {
                return null;
            }

            foreach (var word in PurposeKeywords.Words(purpose))
            {
                if (_keyword.TryGetValue(word, out var id))
                {
                    return id;
                }
            }

            return null;
        }
    }
}
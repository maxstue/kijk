using Kijk.Application.Imports.Categorization;
using Kijk.Application.Imports.Csv;
using Kijk.Application.Imports.Detection;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Ai;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Shared.Security;
using Kijk.Domain.Authorization;
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
    ITransactionCategorizer categorizer,
    IAiGate aiGate,
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
            var detection = await formatDetector.DetectAsync(job.HouseholdId, job.CreatedById, table, delimiter, encoding, headerIndex, cancellationToken);
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
        var minimizeData = await dbContext.Households
            .Where(item => item.Id == job.HouseholdId)
            .Select(item => item.MinimizeData)
            .FirstAsync(cancellationToken);
        var memberNames = minimizeData ? await AiContexts.LoadMemberNamesAsync(dbContext, job.HouseholdId, cancellationToken) : [];
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
                dbContext.ImportCandidates.Add(CreateCandidate(job.Id, record.RowNumber, row, keys, corrections, rules, minimizeData ? memberNames : null));
            }

            job.ReportProgress(Math.Min(records.Count, (batchIndex + 1) * BatchSize), errorCount);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var (fullMonths, edgeMonths) = ImportCoverage.Analyze(dates);
        // Nothing is sent to the AI yet: the review shows exactly what would go out and the user starts it.
        job.FinishReading(fullMonths, edgeMonths);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Proposes categories for the candidates that have none. Only sanitized text leaves the server, identical
    /// contexts are asked once, rows deselected in the preview and card statements are skipped, and categories from
    /// corrections, rules or the user are never touched. A failure keeps
    /// all rows and leaves them uncategorized.
    /// </summary>
    /// <param name="importJobId">The import.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the step is done.</returns>
    public async Task CategorizeAsync(Guid importJobId, CancellationToken cancellationToken)
    {
        var job = await dbContext.ImportJobs.FirstOrDefaultAsync(item => item.Id == importJobId, cancellationToken);
        if (job is null || job.Status != ImportJobStatus.Categorizing)
        {
            return;
        }

        try
        {
            var count = 0;
            var unavailable = false;
            // The worker checks everything again: permission, the household's level and the AI gate.
            var allowed = job.AiDataSharing == AiDataSharing.Strict
                          && await dbContext.AuthorizeHouseholdAsync(job.CreatedById, job.HouseholdId, HouseholdPermissions.Finances.Import, cancellationToken) is null
                          && await aiGate.CanUseAiAsync(job.HouseholdId, job.CreatedById, cancellationToken);
            if (allowed)
            {
                (count, unavailable) = await CategorizeCandidatesAsync(job, cancellationToken);
            }

            job.FinishCategorizing(count, unavailable);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning("Categorizing import {ImportJobId} failed with {ExceptionType}", job.Id, exception.GetType().Name);
            // A cancelled import stays cancelled; otherwise the rows wait for the review without categories.
            await dbContext.ImportJobs
                .Where(item => item.Id == importJobId && item.Status == ImportJobStatus.Categorizing)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(item => item.Status, ImportJobStatus.NeedsReview)
                        .SetProperty(item => item.AiCategorizationUnavailable, true),
                    cancellationToken);
        }
    }

    private async Task<(int Count, bool Unavailable)> CategorizeCandidatesAsync(ImportJob job, CancellationToken cancellationToken)
    {
        // Rows the user deselected in the preview stay on the server.
        var candidates = await AiContexts.Eligible(dbContext, job.Id)
            .Where(item => !item.AiExcluded)
            .ToListAsync(cancellationToken);
        if (candidates.Count == 0)
        {
            return (0, false);
        }

        var memberNames = await AiContexts.LoadMemberNamesAsync(dbContext, job.HouseholdId, cancellationToken);
        var categories = await dbContext.Categories
            .Where(item => item.CreatorType == CreatorType.System || item.HouseholdId == job.HouseholdId)
            .OrderBy(item => item.Name)
            .Select(item => new CategoryOption(item.Id, item.Name, item.Kind))
            .ToListAsync(cancellationToken);

        // Identical sanitized contexts are asked only once; the answer applies to every matching row.
        var (contexts, _) = AiContexts.Build(candidates, memberNames);
        var result = await categorizer.CategorizeAsync(
            job.HouseholdId,
            job.CreatedById,
            [.. contexts.Select(context => context.Item)],
            categories,
            cancellationToken);

        var categorized = 0;
        foreach (var context in contexts)
        {
            if (!result.Assignments.TryGetValue(context.Item.Id, out var categoryId))
            {
                continue;
            }

            foreach (var row in context.Rows)
            {
                row.ProposeCategory(categoryId, CategorySource.Ai);
                categorized++;
            }
        }

        return (categorized, result.Unavailable);
    }

    private static ImportCandidate CreateCandidate(
        Guid importJobId,
        int rowNumber,
        ParsedRow row,
        ImportKeyBuilder keys,
        Dictionary<string, Guid> corrections,
        RuleSet rules,
        IReadOnlyCollection<string>? minimizeWithMemberNames)
    {
        // The booking key is computed from the full row, so re-imports and corrections are recognized in any mode.
        var (bookingKey, counterpartyKey) = keys.Build(row);
        var counterparty = row.Counterparty;
        var purpose = PurposeScrubber.Scrub(row.Purpose);
        var isCardSettlement = CardSettlementDetector.IsSettlement(row.Amount!.Value, counterparty, purpose);
        if (minimizeWithMemberNames is not null)
        {
            // Data-minimizing households keep neither names of private persons nor the key of the counterparty IBAN.
            (counterparty, purpose) = TransactionSanitizer.ReplacePersons(counterparty, purpose, row.IsMerchantPayment, minimizeWithMemberNames);
            counterpartyKey = null;
        }

        var candidate = ImportCandidate.CreateValid(importJobId, rowNumber, new ImportCandidateValues(
            row.Date!.Value,
            row.Amount.Value,
            Truncate(counterparty, 200),
            Truncate(purpose, 500),
            row.Status,
            row.IsMerchantPayment,
            bookingKey,
            counterpartyKey,
            isCardSettlement));

        if (corrections.TryGetValue(bookingKey, out var correctedCategoryId))
        {
            candidate.ProposeCategory(correctedCategoryId, CategorySource.Manual);
        }
        else if (rules.Find(counterpartyKey, candidate.Counterparty, row.IsMerchantPayment, candidate.Purpose) is { } ruleCategoryId)
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
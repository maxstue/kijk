using System.Globalization;
using Kijk.Application.Imports.Csv;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Csv;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Paging;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Imports.Queries;

/// <summary>
/// Retrieves imports of the active space, the preview of an uploaded file and the rows waiting for review.
/// </summary>
public sealed class QueriesHandler(IAppDbContext dbContext, CurrentUser currentUser, ImportFileReader fileReader)
{
    /// <summary>Searches, filters, sorts and optionally pages the visible import history.</summary>
    /// <param name="request">The search, sort and page.</param>
    /// <param name="status">An optional processing status.</param>
    /// <param name="accountId">An optional visible account.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The matching imports.</returns>
    public async Task<Result<PageResponse<ImportJobResponse>>> ListAsync(
        ListRequest<ImportSort> request, ImportJobStatus? status, Guid? accountId, CancellationToken cancellationToken)
    {
        var query = dbContext.GetVisibleImports(currentUser)
            .Include(item => item.Account)
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId)
            .AsNoTracking();
        if (request.Search.ToContainsPattern() is { } pattern)
        {
            query = query.Where(item => EF.Functions.ILike(item.FileName, pattern, PagingExtensions.LikeEscape)
                || EF.Functions.ILike(item.Account.Name, pattern, PagingExtensions.LikeEscape));
        }

        if (status is not null)
        {
            query = query.Where(item => item.Status == status);
        }

        if (accountId is not null)
        {
            query = query.Where(item => item.AccountId == accountId);
        }

        var ordered = request.Sort switch
        {
            ImportSort.FileName => query.OrderBy(item => item.FileName, request.Descending),
            ImportSort.Account => query.OrderBy(item => item.Account.Name, request.Descending),
            _ => query.OrderBy(item => item.CreatedAt, request.Descending)
        };
        var page = await ordered.ThenBy(item => item.Id).ToPageAsync(request.Page, request.PageSize, cancellationToken);
        return page.Map(job => job.ToResponse());
    }

    /// <summary>Gets an import of the active space.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The import, or a not-found error.</returns>
    public async Task<Result<ImportJobResponse>> DetailsAsync(Guid id, CancellationToken cancellationToken)
    {
        var job = await FindAsync(id, cancellationToken);
        return job is null ? Error.NotFound("Import could not be found") : job.ToResponse();
    }

    /// <summary>
    /// Gets the first rows of the uploaded file, decoded with the given or the proposed format, for the mapping step.
    /// </summary>
    /// <param name="id">The import id.</param>
    /// <param name="delimiter">An optional delimiter to try.</param>
    /// <param name="encoding">An optional encoding to try.</param>
    /// <param name="headerRowIndex">An optional header row to try.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The preview, or a not-found, validation or conflict error.</returns>
    public async Task<Result<ImportPreviewResponse>> FilePreviewAsync(
        Guid id,
        string? delimiter,
        string? encoding,
        int? headerRowIndex,
        CancellationToken cancellationToken)
    {
        var job = await FindAsync(id, cancellationToken);
        if (job is null)
        {
            return Error.NotFound("Import could not be found");
        }

        if (job.Status != ImportJobStatus.NeedsMapping)
        {
            return Error.Conflict("The import does not wait for a column mapping");
        }

        var content = await fileReader.LoadAsync(job.Id, cancellationToken);
        if (content is null)
        {
            return Error.NotFound("The uploaded file has expired");
        }

        if (delimiter is not null && !CsvImportMapping.Delimiters.Contains(delimiter)
            || encoding is not null && !CsvImportMapping.Encodings.Contains(encoding))
        {
            return Error.Validation("Delimiter or encoding is not supported");
        }

        var proposal = ImportMapper.Deserialize(job.ProposedMapping);
        var resolvedEncoding = encoding ?? proposal?.Encoding ?? CsvDecoder.DetectEncoding(content);
        var text = CsvDecoder.Decode(content, resolvedEncoding);
        var resolvedDelimiter = delimiter ?? proposal?.Delimiter ?? CsvFormatDetector.DetectDelimiter(text).ToString();
        var table = CsvTable.Read(text, resolvedDelimiter[0]);
        var header = headerRowIndex ?? proposal?.HeaderRowIndex ?? Math.Max(0, CsvFormatDetector.DetectHeaderRow(new CsvTable([.. table.Records.Take(60)])));
        if (header < 0 || header >= table.Records.Count)
        {
            return Error.Validation("The header row does not exist");
        }

        return new ImportPreviewResponse(
            resolvedEncoding,
            resolvedDelimiter,
            header,
            [.. table.Records[header].Fields],
            [.. table.Records.Skip(header + 1).Take(ImportLimits.PreviewRows).Select(record => record.Fields.ToList())],
            table.Records.Count);
    }

    /// <summary>Gets a bounded page of review rows with totals over the selected months.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="request">Display filters and paging.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The page, or a not-found or invalid-month error.</returns>
    public async Task<Result<ImportCandidatePageResponse>> CandidatesAsync(
        Guid id,
        CandidatesRequest request,
        CancellationToken cancellationToken)
    {
        var job = await FindAsync(id, cancellationToken);
        if (job is null)
        {
            return Error.NotFound("Import could not be found");
        }

        var all = dbContext.ImportCandidates.Where(item => item.ImportJobId == id);
        var query = all;
        if (request.Months is not null)
        {
            var selected = FilterMonths(query, job, request.Months);
            if (selected.IsError)
            {
                return selected.Error;
            }
            query = selected.Value;
        }

        var summary = await query.GroupBy(_ => 1).Select(group => new
        {
            Count = group.Count(),
            Included = group.Count(item => item.Errors == null && !item.Excluded),
            CardSettlements = group.Count(item => item.Errors == null && !item.Excluded && item.IsCardSettlement)
        }).SingleOrDefaultAsync(cancellationToken);

        // Display filters run after the summary, so they never change what the commit action saves.
        query = ApplyDisplayFilters(query, all, request);
        var totalCount = await query.CountAsync(cancellationToken);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var lastPage = Math.Max(1, (totalCount + pageSize - 1) / pageSize);
        var page = Math.Clamp(request.Page, 1, lastPage);
        var items = await query.OrderBy(item => item.Errors == null).ThenBy(item => item.RowNumber).ThenBy(item => item.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).AsNoTracking().ToResponses().ToListAsync(cancellationToken);
        var errors = await all.Where(item => item.Errors != null).OrderBy(item => item.RowNumber).ThenBy(item => item.Id)
            .Take(10).Select(item => new CsvRowErrorResponse(item.RowNumber, item.Errors!)).ToListAsync(cancellationToken);

        return new ImportCandidatePageResponse(items, totalCount, page, pageSize,
            summary?.Included ?? 0, job.ErrorCount, errors, summary?.CardSettlements ?? 0);
    }

    private static IQueryable<ImportCandidate> ApplyDisplayFilters(
        IQueryable<ImportCandidate> selected,
        IQueryable<ImportCandidate> all,
        CandidatesRequest request)
    {
        var query = request switch
        {
            // The card statement list ignores the review filter.
            { CardSettlementsOnly: true } => selected.Where(item => item.Errors == null && !item.Excluded && item.IsCardSettlement),
            // Unreadable dates cannot be assigned to a selected month; show the error rows of the whole file.
            { Filter: CandidateFilter.Errors } => all.Where(item => item.Errors != null),
            { Filter: CandidateFilter.Uncategorized } => selected.Where(item => item.Errors == null && item.CategoryId == null),
            { Filter: CandidateFilter.Excluded } => selected.Where(item => item.Excluded),
            _ => selected
        };

        return request.Search.ToContainsPattern() is { } pattern
            ? query.Where(item => item.Counterparty != null && EF.Functions.ILike(item.Counterparty, pattern, PagingExtensions.LikeEscape)
                                  || item.Purpose != null && EF.Functions.ILike(item.Purpose, pattern, PagingExtensions.LikeEscape))
            : query;
    }

    private static Result<IQueryable<ImportCandidate>> FilterMonths(IQueryable<ImportCandidate> query, ImportJob job, string months)
    {
        var allowed = job.FullMonths.Concat(job.EdgeMonths).Select(DateOnly.FromDateTime).ToHashSet();
        var selected = new HashSet<int>();
        foreach (var value in months.Split(',', StringSplitOptions.RemoveEmptyEntries))
        {
            if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var month)
                || month.Day != 1 || !allowed.Contains(month))
            {
                return Error.Validation("The selected month is not part of the import");
            }
            selected.Add(month.Year * 12 + month.Month);
        }
        return new Result<IQueryable<ImportCandidate>>(query.Where(item => item.Errors == null && item.BookingDate != null
            && selected.Contains(item.BookingDate.Value.Year * 12 + item.BookingDate.Value.Month)));
    }

    private Task<ImportJob?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.GetVisibleImports(currentUser)
            .Include(item => item.Account)
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
}
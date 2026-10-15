using System.Globalization;
using Kijk.Application.Imports.Csv;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Imports.Get;

/// <summary>
/// Retrieves imports of the active space, the preview of an uploaded file and the rows waiting for review.
/// </summary>
public sealed class GetImportsHandler(IAppDbContext dbContext, CurrentUser currentUser, ImportFileReader fileReader)
{
    private const int ListSize = 20;

    /// <summary>Gets the latest imports of the active space.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The imports, newest first.</returns>
    public async Task<Result<List<ImportJobResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var jobs = await dbContext.GetVisibleImports(currentUser)
            .Include(item => item.Account)
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId)
            .OrderByDescending(item => item.CreatedAt)
            .Take(ListSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return jobs.Select(job => job.ToResponse()).ToList();
    }

    /// <summary>Gets an import of the active space.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The import, or a not-found error.</returns>
    public async Task<Result<ImportJobResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
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
    public async Task<Result<ImportPreviewResponse>> GetPreviewAsync(
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
    /// <param name="page">The one-based page number, clamped to the available pages.</param>
    /// <param name="pageSize">The page size, clamped to 1-100.</param>
    /// <param name="months">Comma-separated first days of selected months; null includes all rows.</param>
    /// <param name="cardSettlementsOnly">Whether to show only included, readable card statements.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The page, or a not-found or invalid-month error.</returns>
    public async Task<Result<ImportCandidatePageResponse>> GetCandidatesAsync(
        Guid id,
        int page,
        int pageSize,
        string? months,
        bool cardSettlementsOnly,
        CancellationToken cancellationToken)
    {
        var job = await FindAsync(id, cancellationToken);
        if (job is null)
        {
            return Error.NotFound("Import could not be found");
        }

        var all = dbContext.ImportCandidates.Where(item => item.ImportJobId == id);
        var query = all;
        if (months is not null)
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
            query = query.Where(item => item.Errors == null && item.BookingDate != null
                && selected.Contains(item.BookingDate.Value.Year * 12 + item.BookingDate.Value.Month));
        }

        var summary = await query.GroupBy(_ => 1).Select(group => new
        {
            Count = group.Count(),
            Included = group.Count(item => item.Errors == null && !item.Excluded),
            CardSettlements = group.Count(item => item.Errors == null && !item.Excluded && item.IsCardSettlement)
        }).SingleOrDefaultAsync(cancellationToken);
        var totalCount = summary?.Count ?? 0;
        if (cardSettlementsOnly)
        {
            query = query.Where(item => item.Errors == null && !item.Excluded && item.IsCardSettlement);
            totalCount = summary?.CardSettlements ?? 0;
        }

        pageSize = Math.Clamp(pageSize, 1, 100);
        var lastPage = Math.Max(1, (totalCount + pageSize - 1) / pageSize);
        page = Math.Clamp(page, 1, lastPage);
        var items = await query.OrderBy(item => item.Errors == null).ThenBy(item => item.RowNumber).ThenBy(item => item.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).AsNoTracking().ToResponses().ToListAsync(cancellationToken);
        var errors = await all.Where(item => item.Errors != null).OrderBy(item => item.RowNumber).ThenBy(item => item.Id)
            .Take(10).Select(item => new ImportCandidateErrorResponse(item.RowNumber, item.Errors!)).ToListAsync(cancellationToken);

        return new ImportCandidatePageResponse(items, totalCount, page, pageSize,
            summary?.Included ?? 0, job.ErrorCount, errors, summary?.CardSettlements ?? 0);
    }

    private Task<ImportJob?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.GetVisibleImports(currentUser)
            .Include(item => item.Account)
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
}
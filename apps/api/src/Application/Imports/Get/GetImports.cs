using Kijk.Application.Imports.Csv;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Imports.Get;

/// <summary>
/// Retrieves imports of the active household, the preview of an uploaded file and the rows waiting for review.
/// </summary>
public sealed class GetImportsHandler(IAppDbContext dbContext, CurrentUser currentUser, ImportFileReader fileReader) : IHandler
{
    private const int ListSize = 20;

    /// <summary>Gets the latest imports of the active household.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The imports, newest first.</returns>
    public async Task<Result<List<ImportJobResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var jobs = await dbContext.ImportJobs
            .Include(item => item.Account)
            .Where(item => item.HouseholdId == currentUser.ActiveHouseholdId)
            .OrderByDescending(item => item.CreatedAt)
            .Take(ListSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return jobs.Select(job => job.ToResponse()).ToList();
    }

    /// <summary>Gets an import of the active household.</summary>
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

    /// <summary>Gets the rows of an import waiting for review, rows with errors first.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The rows, or a not-found error.</returns>
    public async Task<Result<List<ImportCandidateResponse>>> GetCandidatesAsync(Guid id, CancellationToken cancellationToken)
    {
        if (await FindAsync(id, cancellationToken) is null)
        {
            return Error.NotFound("Import could not be found");
        }

        var candidates = await dbContext.ImportCandidates
            .Where(item => item.ImportJobId == id)
            .OrderBy(item => item.Errors == null)
            .ThenBy(item => item.RowNumber)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return candidates.Select(candidate => candidate.ToResponse()).ToList();
    }

    private Task<ImportJob?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.ImportJobs
            .Include(item => item.Account)
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
}
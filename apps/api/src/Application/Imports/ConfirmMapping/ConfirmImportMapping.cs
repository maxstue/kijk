using Kijk.Application.Imports.Csv;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Imports.ConfirmMapping;

/// <summary>
/// Confirms the column mapping of an import, stores it as profile for the next import of the same format and queues
/// reading the whole file.
/// </summary>
public sealed class ConfirmImportMappingHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    ImportFileReader fileReader,
    IImportJobQueue queue,
    TimeProvider timeProvider) : IHandler
{
    private const int ShownErrors = 10;

    /// <summary>Confirms a mapping after checking it against the first rows.</summary>
    /// <param name="id">The import id.</param>
    /// <param name="mapping">The mapping.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The import, or a not-found, validation or conflict error.</returns>
    public async Task<Result<ImportJobResponse>> ConfirmAsync(Guid id, CsvImportMapping mapping, CancellationToken cancellationToken)
    {
        var job = await dbContext.GetVisibleImports(currentUser)
            .Include(item => item.Account)
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
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

        if (!CsvImportMapping.Encodings.Contains(mapping.Encoding) || !CsvImportMapping.Delimiters.Contains(mapping.Delimiter))
        {
            return Error.Validation("Delimiter or encoding is not supported");
        }

        var table = ImportFileReader.ReadTable(content, mapping);
        var errors = MappingValidator.Validate(mapping, table);
        if (errors.Count > 0)
        {
            var more = errors.Count > ShownErrors ? $" (and {errors.Count - ShownErrors} more)" : string.Empty;
            return Error.Validation(string.Join("; ", errors.Take(ShownErrors)) + more);
        }

        var json = ImportMapper.Serialize(mapping);
        await SaveProfileAsync(job, table, mapping, json, cancellationToken);
        job.ConfirmMapping(json);
        await queue.SaveChangesAndEnqueueAsync(new ReadImport(job.Id), cancellationToken);

        return job.ToResponse();
    }

    private async Task SaveProfileAsync(ImportJob job, CsvTable table, CsvImportMapping mapping, string json, CancellationToken cancellationToken)
    {
        var fingerprint = HeaderFingerprint.Compute(table.Records[mapping.HeaderRowIndex].Fields, mapping.Delimiter, mapping.Encoding);
        var latest = await dbContext.ImportProfiles
            .Where(item => item.SpaceId == job.SpaceId && item.HeaderFingerprint == fingerprint)
            .OrderByDescending(item => item.Version)
            .FirstOrDefaultAsync(cancellationToken);
        if (latest?.Mapping == json)
        {
            return;
        }

        dbContext.ImportProfiles.Add(new ImportProfile
        {
            HeaderFingerprint = fingerprint,
            Name = job.Account.Name,
            Mapping = json,
            Version = (latest?.Version ?? 0) + 1,
            ConfirmedAt = timeProvider.GetUtcNow().UtcDateTime,
            SpaceId = job.SpaceId
        });
    }
}
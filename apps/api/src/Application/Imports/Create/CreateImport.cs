using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Jobs;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Imports.Create;

/// <summary>
/// Stores an uploaded bank export encrypted and queues its analysis. The request never waits for the processing.
/// </summary>
public sealed class CreateImportHandler(
    IAppDbContext dbContext,
    CurrentUser currentUser,
    IImportFileProtector protector,
    IJobQueue queue,
    TimeProvider timeProvider,
    ILogger<CreateImportHandler> logger) : IHandler
{
    /// <summary>Creates an import for a bank account.</summary>
    /// <param name="accountId">The bank account.</param>
    /// <param name="fileName">The uploaded file name.</param>
    /// <param name="content">The file content.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The pending import, or a not-found, validation or conflict error.</returns>
    public async Task<Result<ImportJobResponse>> CreateAsync(Guid accountId, string fileName, Stream content, CancellationToken cancellationToken)
    {
        var space = await dbContext.Spaces
            .FirstOrDefaultAsync(item => item.Id == currentUser.ActiveSpaceId, cancellationToken);
        var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Id == currentUser.Id, cancellationToken);
        if (space is null || user is null)
        {
            logger.LogWarning("Active space or user could not be resolved for user {UserId}", currentUser.Id);
            return Error.NotFound("Active space could not be found");
        }

        if (user.SensitiveDataConsentAt is null)
        {
            return Error.Validation("Consent to processing sensitive data in bank exports is required before importing");
        }

        var account = await dbContext.GetSpaceAccounts(currentUser)
            .FirstOrDefaultAsync(item => item.Id == accountId, cancellationToken);
        if (account is null)
        {
            return Error.NotFound("Account is not available in the active space");
        }

        if (account.Kind != AccountKind.Bank)
        {
            return Error.Validation("Bank exports can only be imported into bank accounts");
        }

        var hasOpenImport = await dbContext.ImportJobs.AnyAsync(
            item => item.AccountId == account.Id
                    && item.Status != ImportJobStatus.Done
                    && item.Status != ImportJobStatus.Failed
                    && item.Status != ImportJobStatus.Cancelled,
            cancellationToken);
        if (hasOpenImport)
        {
            return Error.Conflict("Finish or cancel the open import of this account first");
        }

        var bytes = await ReadLimitedAsync(content, cancellationToken);
        if (bytes is null)
        {
            return Error.Validation($"The file must not be larger than {ImportLimits.MaxFileBytes / 1024 / 1024} MB");
        }

        if (bytes.Length == 0)
        {
            return Error.Validation("The file is empty");
        }

        var name = Path.GetFileName(fileName).Trim();
        var job = ImportJob.Create(
            name.Length > ImportLimits.FileNameMaximumLength ? name[..ImportLimits.FileNameMaximumLength] : name,
            account,
            user,
            space);
        dbContext.ImportJobs.Add(job);
        dbContext.ImportFiles.Add(ImportFile.Create(protector.Protect(bytes), job, timeProvider.GetUtcNow().UtcDateTime));
        await queue.SaveChangesAndEnqueueAsync(new AnalyzeImport(job.Id), cancellationToken);

        return job.ToResponse();
    }

    private static async Task<byte[]?> ReadLimitedAsync(Stream content, CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while ((read = await content.ReadAsync(chunk, cancellationToken)) > 0)
        {
            if (buffer.Length + read > ImportLimits.MaxFileBytes)
            {
                return null;
            }

            await buffer.WriteAsync(chunk.AsMemory(0, read), cancellationToken);
        }

        return buffer.ToArray();
    }
}
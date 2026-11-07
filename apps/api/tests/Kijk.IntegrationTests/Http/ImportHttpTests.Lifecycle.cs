using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Imports.AiDataPreview;
using Kijk.Application.Imports.Cleanup;
using Kijk.Application.Imports.Commit;
using Kijk.Application.Imports.Settings;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Imports.StartCategorization;
using Kijk.Application.Imports.UpdateCandidate;
using Kijk.Application.Transactions.Categorize;
using Kijk.Application.Users.Update;
using Kijk.Domain.Catalogs;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Imports;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Kijk.IntegrationTests.Http;

public partial class ImportHttpTests
{

    [Test]
    public async Task LegacyDisabledSettingCannotDiscardImportJobs()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(
            fixture.User.AuthId,
            jobsEnabled: true,
            configuration: new Dictionary<string, string?> { ["Jobs:Enabled"] = "false" });

        var job = await UploadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "dkb-synthetic.csv");
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsMapping);

        await Assert.That(job.ProposedMapping).IsNotNull();
    }


    [Test]
    public async Task ATestWithoutWorkersRejectsUploadsWithoutSavingTheImport()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);

        using var response = await UploadResponseAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "dkb-synthetic.csv");

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.InternalServerError);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.ImportJobs.AnyAsync()).IsFalse();
        await Assert.That(await verification.ImportFiles.AnyAsync()).IsFalse();
    }


    [Test]
    public async Task ConcurrentUploadsForTheSameAccountOnlyCreateOneImport()
    {
        var fixture = await CreateFixtureAsync("Member");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);

        var responses = await Task.WhenAll(
            UploadResponseAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "ing-synthetic.csv"),
            UploadResponseAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "ing-synthetic.csv"));
        try
        {
            await Assert.That(responses.Select(response => response.StatusCode))
                .IsEquivalentTo(new[] { HttpStatusCode.Accepted, HttpStatusCode.Conflict });
            await using var verification = PostgreSqlTestDatabase.CreateDbContext();
            await Assert.That(await verification.ImportJobs.CountAsync()).IsEqualTo(1);
            await Assert.That(await verification.ImportFiles.CountAsync()).IsEqualTo(1);
        }
        finally
        {
            foreach (var response in responses)
            {
                response.Dispose();
            }
        }
    }


    [Test]
    public async Task CancellingDeletesTheFileRightAway()
    {
        var fixture = await CreateFixtureAsync("Member");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        var job = await UploadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "ing-synthetic.csv");
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsMapping);

        using var cancelled = await host.Client.PostAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/cancel", null);
        using var uploadAgain = await UploadResponseAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "ing-synthetic.csv");

        await Assert.That(cancelled.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(uploadAgain.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.ImportFiles.AnyAsync(item => item.ImportJobId == job.Id)).IsFalse();
        await Assert.That((await verification.ImportJobs.SingleAsync(item => item.Id == job.Id)).Status).IsEqualTo(ImportJobStatus.Cancelled);
    }


    [Test]
    public async Task CleanupFailsExpiredImportsAndDeletesTheirFiles()
    {
        var fixture = await CreateFixtureAsync("Admin");
        Guid jobId;
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var account = await dbContext.Accounts.Include(item => item.Space).SingleAsync(item => item.Id == fixture.Account.Id);
            var user = await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id);
            var job = ImportJob.Create("old.csv", account, user, account.Space);
            dbContext.ImportJobs.Add(job);
            dbContext.ImportFiles.Add(ImportFile.Create([1, 2, 3], job, DateTime.UtcNow.AddDays(-2)));
            await dbContext.SaveChangesAsync();
            jobId = job.Id;
        }

        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var deleted = await new CleanupImportsHandler(dbContext, TimeProvider.System, NullLogger<CleanupImportsHandler>.Instance).CleanupAsync(CancellationToken.None);
            await Assert.That(deleted).IsEqualTo(1);
        }

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var expired = await verification.ImportJobs.SingleAsync(item => item.Id == jobId);
        await Assert.That(expired.Status).IsEqualTo(ImportJobStatus.Failed);
        await Assert.That(await verification.ImportFiles.AnyAsync()).IsFalse();
    }

}
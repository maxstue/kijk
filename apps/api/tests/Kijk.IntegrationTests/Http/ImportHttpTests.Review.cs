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
    public async Task CandidatePagesFilterBeforePagingAndCommitIncludesEverySelectedPage()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        var job = await UploadAndReadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id);
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            await dbContext.ImportCandidates.Where(item => item.ImportJobId == job.Id).ExecuteDeleteAsync();
            for (var index = 0; index < 321; index++)
            {
                var month = index switch { < 250 => October, < 291 => November, _ => September };
                var row = ImportCandidate.CreateValid(job.Id, index + 1, new ImportCandidateValues(
                    month.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc), -12.34m, "Merchant", null,
                    TransactionStatus.Booked, true, $"booking-{index}", null, IsCardSettlement: index < 250 && index % 2 == 0));
                row.SetExcluded(index is >= 245 and < 250);
                dbContext.ImportCandidates.Add(row);
            }
            dbContext.ImportCandidates.AddRange(Enumerable.Range(322, 15).Select(number => ImportCandidate.CreateInvalid(job.Id, number, "Invalid date")));
            var storedJob = await dbContext.ImportJobs.SingleAsync(item => item.Id == job.Id);
            storedJob.ReportProgress(336, 15);
            await dbContext.SaveChangesAsync();
        }

        var first = (await host.Client.GetFromJsonAsync<ImportCandidatePageResponse>($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/candidates?months=2026-10-01&page=1&pageSize=100", Json))!;
        var second = (await host.Client.GetFromJsonAsync<ImportCandidatePageResponse>($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/candidates?months=2026-10-01&page=2&pageSize=100", Json))!;
        var last = (await host.Client.GetFromJsonAsync<ImportCandidatePageResponse>($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/candidates?months=2026-10-01&page=999&pageSize=10000", Json))!;
        var cards = (await host.Client.GetFromJsonAsync<ImportCandidatePageResponse>($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/candidates?months=2026-10-01&cardSettlementsOnly=true&page=2&pageSize=10", Json))!;
        await Assert.That(first.Items.Count).IsEqualTo(100);
        await Assert.That(first.TotalCount).IsEqualTo(250);
        await Assert.That(first.IncludedCount).IsEqualTo(245);
        await Assert.That(first.ErrorCount).IsEqualTo(15);
        await Assert.That(first.ErrorSamples.Count).IsEqualTo(10);
        await Assert.That(first.Items.All(item => item.BookingDate!.Value.Month == 10)).IsTrue();
        await Assert.That(first.Items.Select(item => item.Id).Intersect(second.Items.Select(item => item.Id))).IsEmpty();
        await Assert.That(second.Items.Select(item => item.RowNumber)).IsEquivalentTo(Enumerable.Range(101, 100));
        await Assert.That(second.IncludedCount).IsEqualTo(245);
        await Assert.That(last.PageSize).IsEqualTo(100);
        await Assert.That(last.Page).IsEqualTo(3);
        await Assert.That(last.Items.Count).IsEqualTo(50);
        await Assert.That(cards.Items.Count).IsEqualTo(10);
        await Assert.That(cards.TotalCount).IsEqualTo(123);
        await Assert.That(cards.IncludedCount).IsEqualTo(245);
        await Assert.That(cards.Items.All(item => item.IsCardSettlement && !item.Excluded)).IsTrue();
        using var invalidMonth = await host.Client.GetAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/candidates?months=2026-12-01");
        await Assert.That(invalidMonth.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        using var missing = await host.Client.GetAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{Guid.NewGuid()}/candidates?months=2026-10-01");
        await Assert.That(missing.StatusCode).IsEqualTo(HttpStatusCode.NotFound);

        using var committed = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/commit", new CommitImportRequest([November], true), Json);
        await Assert.That(committed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        var result = (await committed.Content.ReadFromJsonAsync<ImportJobResponse>(Json))!;
        await Assert.That(result.ImportedCount).IsEqualTo(286);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.Transactions.CountAsync()).IsEqualTo(286);
    }


    [Test]
    public async Task ResetOverridesClearsEveryManualRowButPreservesAutomaticCategoriesAndSelections()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        var job = await UploadAndReadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id);
        Guid automaticId;
        Guid excludedId;
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            await dbContext.ImportCandidates.Where(item => item.ImportJobId == job.Id).ExecuteDeleteAsync();
            var rows = Enumerable.Range(1, 205).Select(number =>
            {
                var row = ImportCandidate.CreateValid(job.Id, number, new ImportCandidateValues(
                    (number > 100 ? November : October).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
                    -12m, "Merchant", null, TransactionStatus.Booked, true, $"booking-{number}", null));
                row.ChooseCategory(GroceriesId);
                return row;
            }).ToList();
            rows[0].ProposeCategory(HousingId, CategorySource.Ai);
            rows[1].ProposeCategory(GroceriesId, CategorySource.Rule);
            rows[^1].SetExcluded(true);
            dbContext.ImportCandidates.AddRange(rows);
            await dbContext.SaveChangesAsync();
            automaticId = rows[0].Id;
            excludedId = rows[^1].Id;
        }

        using var response = await host.Client.DeleteAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/category-overrides");
        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(await response.Content.ReadFromJsonAsync<int>()).IsEqualTo(203);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var stored = await verification.ImportCandidates.Where(item => item.ImportJobId == job.Id).ToListAsync();
        await Assert.That(stored.Count(item => item.CategoryId is null && item.CategorySource is null)).IsEqualTo(203);
        await Assert.That(stored.Single(item => item.Id == automaticId).CategoryId).IsEqualTo(HousingId);
        await Assert.That(stored.Count(item => item.CategorySource == CategorySource.Rule)).IsEqualTo(1);
        await Assert.That(stored.Single(item => item.Id == excludedId).Excluded).IsTrue();
        using var missing = await host.Client.DeleteAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{Guid.NewGuid()}/category-overrides");
        await Assert.That(missing.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }


    [Test]
    public async Task ResetOverridesRequiresReviewAndImportPermission()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        var job = await UploadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "dkb-synthetic.csv");
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsMapping);
        using var response = await host.Client.DeleteAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/category-overrides");
        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var membership = await dbContext.UserSpaces.SingleAsync(item => item.UserId == fixture.User.Id && item.SpaceId == fixture.Account.SpaceId);
            membership.ChangeRole(await dbContext.Roles.SingleAsync(item => item.Name == "Viewer"));
            await dbContext.SaveChangesAsync();
        }
        using var forbidden = await host.Client.DeleteAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/category-overrides");
        await Assert.That(forbidden.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
    }


    [Test]
    public async Task CardStatementsCountAsOffsetOnlyAfterConfirmation()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        var file = """
            Datum;Empfänger;Verwendungszweck;Betrag
            01.10.2026;Musterbank;Kreditkartenabrechnung 09/2026;-420,00
            15.10.2026;Musterbank;VISA Abrechnung Oktober;-80,00
            20.10.2026;Bäckerei;Brötchen;-3,20
            """u8.ToArray();

        var job = await UploadBytesAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, file);
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsMapping);
        using var confirmed = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/mapping", job.ProposedMapping, Json);
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsReview);
        var rows = await GetCandidatesAsync(host.Client, fixture.Account.SpaceId, job.Id);
        var statements = rows.Where(row => row.IsCardSettlement).ToList();
        await Assert.That(statements.Count).IsEqualTo(2);
        await Assert.That(rows.Single(row => row.Counterparty == "Bäckerei").IsCardSettlement).IsFalse();

        var offset = statements.Single(row => row.Amount == -420m);
        using var updated = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/candidates/{offset.Id}", new UpdateImportCandidateRequest(null, false, true), Json);
        await Assert.That(updated.StatusCode).IsEqualTo(HttpStatusCode.OK);
        // The file covers only part of October, which is therefore an edge month to include explicitly.
        await CommitAsync(host.Client, fixture.Account.SpaceId, job.Id, [October]);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var transactions = await verification.Transactions.Where(item => item.AccountId == fixture.Account.Id).ToListAsync();
        await Assert.That(transactions.Single(item => item.Amount == -420m).IsTransfer).IsTrue();
        await Assert.That(transactions.Single(item => item.Amount == -80m).IsTransfer).IsFalse();
    }

}
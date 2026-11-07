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
    public async Task ImportReplacesCoveredMonthsAndKeepsFilesOnlyUntilCommitted()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);

        var job = await UploadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "dkb-synthetic.csv");
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsMapping);
        await Assert.That(job.ProposedMappingSource).IsEqualTo(MappingSource.Suggestion);
        using (var preview = await host.Client.GetAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/preview"))
        {
            await Assert.That(preview.StatusCode).IsEqualTo(HttpStatusCode.OK);
        }

        using var confirmed = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/mapping", job.ProposedMapping, Json);
        await Assert.That(confirmed.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsReview);
        await Assert.That(job.FullMonths).IsEquivalentTo(new[] { October });
        await Assert.That(job.EdgeMonths).IsEquivalentTo(new[] { September, November });
        var candidates = await host.Client.GetFromJsonAsync<ImportCandidatePageResponse>($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/candidates", Json);
        await Assert.That(candidates!.TotalCount).IsEqualTo(8);

        job = await CommitAsync(host.Client, fixture.Account.SpaceId, job.Id, [November]);
        var again = await CommitAsync(host.Client, fixture.Account.SpaceId, job.Id, [November]);

        await Assert.That(job.Status).IsEqualTo(ImportJobStatus.Done);
        await Assert.That(job.ImportedCount).IsEqualTo(7);
        await Assert.That(job.SkippedMonths).IsEquivalentTo(new[] { September });
        await Assert.That(again.ImportedCount).IsEqualTo(7);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var transactions = await verification.Transactions.Where(item => item.AccountId == fixture.Account.Id).ToListAsync();
        await Assert.That(transactions.Count).IsEqualTo(7);
        await Assert.That(transactions.All(item => item.BookingKey != null && item.ImportJobId == job.Id)).IsTrue();
        await Assert.That(transactions.Any(item => item.Purpose != null && item.Purpose.Contains("EREF", StringComparison.Ordinal))).IsFalse();
        await Assert.That(transactions.Count(item => item.Status == TransactionStatus.Pending)).IsEqualTo(1);
        await Assert.That(await verification.ImportFiles.AnyAsync()).IsFalse();
        await Assert.That(await verification.ImportCandidates.AnyAsync()).IsFalse();
        await Assert.That(await verification.ImportProfiles.CountAsync()).IsEqualTo(1);
        // The Data Protection key ring is stored encrypted with the key from configuration.
        var keys = await verification.DataProtectionKeys.Select(item => item.Xml).ToListAsync();
        await Assert.That(keys.Count).IsGreaterThan(0);
        await Assert.That(keys.All(xml => xml!.Contains("encryptedSecret", StringComparison.Ordinal) && !xml.Contains("<masterKey", StringComparison.Ordinal))).IsTrue();
    }


    [Test]
    public async Task ReimportPreservesManualBookingsAndReplacesImportsWithoutTheirJobLink()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        await ImportDkbSampleAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, confirmMapping: true);

        List<Guid> importedIds;
        List<Guid> manualIds;
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            importedIds = await dbContext.Transactions.Select(item => item.Id).ToListAsync();
            // Cleanup can remove the job link, but the booking key still identifies an imported transaction.
            await dbContext.Transactions.ExecuteUpdateAsync(setters => setters.SetProperty(item => item.ImportJobId, (Guid?)null));
            var account = await dbContext.Accounts.Include(item => item.Space).SingleAsync(item => item.Id == fixture.Account.Id);
            var user = await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id);
            var manual = new[] { October, November }.Select(month => Transaction.Create(
                new TransactionDetails(month.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc), -12.34m, "Manual booking", null, TransactionStatus.Booked, false),
                account, user, account.Space)).ToList();
            dbContext.Transactions.AddRange(manual);
            await dbContext.SaveChangesAsync();
            manualIds = manual.Select(item => item.Id).ToList();
        }

        await ImportDkbSampleAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, confirmMapping: false);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var transactions = await verification.Transactions.Where(item => item.AccountId == fixture.Account.Id).ToListAsync();
        await Assert.That(transactions.Count).IsEqualTo(9);
        await Assert.That(transactions.Where(item => item.BookingKey == null).Select(item => item.Id)).IsEquivalentTo(manualIds);
        await Assert.That(transactions.Any(item => importedIds.Contains(item.Id))).IsFalse();
        await Assert.That(transactions.Count(item => item.BookingKey != null && item.ImportJobId != null)).IsEqualTo(7);
    }


    [Test]
    public async Task ReimportingAMonthKeepsCorrectionsAndAppliesRememberedMerchants()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        await ImportDkbSampleAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, confirmMapping: true);

        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var rent = await dbContext.Transactions.Where(item => item.Amount == -750m).OrderBy(item => item.BookingKey).FirstAsync();
            var rewe = await dbContext.Transactions.SingleAsync(item => item.Amount == -41.10m);
            using var corrected = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/transactions/{rent.Id}/category", new CategorizeTransactionRequest(HousingId, false), Json);
            using var remembered = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/transactions/{rewe.Id}/category", new CategorizeTransactionRequest(GroceriesId, true), Json);
            await Assert.That(corrected.StatusCode).IsEqualTo(HttpStatusCode.OK);
            var rememberedResult = await remembered.Content.ReadFromJsonAsync<CategorizeTransactionResponse>(Json);
            // The pending REWE booking in November gets the remembered category too.
            await Assert.That(rememberedResult!.AppliedToOthers).IsEqualTo(1);
        }

        // The confirmed profile is used, so the second import needs no mapping step.
        await ImportDkbSampleAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, confirmMapping: false);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var transactions = await verification.Transactions.Where(item => item.AccountId == fixture.Account.Id).ToListAsync();
        await Assert.That(transactions.Count).IsEqualTo(7);
        var rents = transactions.Where(item => item.Amount == -750m).ToList();
        await Assert.That(rents.Count(item => item.CategoryId == HousingId && item.CategorySource == CategorySource.Manual)).IsEqualTo(1);
        await Assert.That(rents.Count(item => item.CategoryId == null)).IsEqualTo(1);
        var reweBookings = transactions.Where(item => item.Counterparty!.StartsWith("REWE", StringComparison.Ordinal)).ToList();
        await Assert.That(reweBookings.Count).IsEqualTo(2);
        await Assert.That(reweBookings.All(item => item.CategoryId == GroceriesId)).IsTrue();
        await Assert.That(await verification.CategoryRules.CountAsync()).IsEqualTo(1);
    }


    [Test]
    public async Task KeywordRulesRememberAPurposeWordWithoutTheCounterparty()
    {
        var fixture = await CreateFixtureAsync("Member");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        await ImportDkbSampleAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, confirmMapping: true);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var rent = await dbContext.Transactions.Where(item => item.Amount == -750m).OrderBy(item => item.BookingKey).FirstAsync();

        using var wrong = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/transactions/{rent.Id}/category", new CategorizeTransactionRequest(HousingId, true, "gehalt"), Json);
        using var remembered = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/transactions/{rent.Id}/category", new CategorizeTransactionRequest(HousingId, true, "Miete"), Json);
        var result = await remembered.Content.ReadFromJsonAsync<CategorizeTransactionResponse>(Json);

        await Assert.That(wrong.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        await Assert.That(result!.Transaction.RememberKeywords).Contains("miete");
        await Assert.That(result.AppliedToOthers).IsEqualTo(1);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var rule = await verification.CategoryRules.SingleAsync();
        await Assert.That(rule.Scope).IsEqualTo(CategoryRuleScope.Keyword);
        await Assert.That(rule.Label).IsEqualTo("miete");
    }

}
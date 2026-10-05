using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Imports.AiPreview;
using Kijk.Application.Imports.Categorize;
using Kijk.Application.Imports.Cleanup;
using Kijk.Application.Imports.Commit;
using Kijk.Application.Imports.Review;
using Kijk.Application.Imports.Settings;
using Kijk.Application.Imports.Shared;
using Kijk.Application.Transactions.Categorize;
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

// Runs the whole import over HTTP with the real Wolverine durable queue, Data Protection and Postgres.
[NotInParallel]
public class ImportHttpTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    private static readonly Guid GroceriesId = SystemCategories.All.Single(category => category.Name == "Groceries").Id;
    private static readonly Guid HousingId = SystemCategories.All.Single(category => category.Name == "Housing").Id;
    private static readonly DateOnly September = new(2026, 9, 1);
    private static readonly DateOnly October = new(2026, 10, 1);
    private static readonly DateOnly November = new(2026, 11, 1);

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task ImportReplacesCoveredMonthsAndKeepsFilesOnlyUntilCommitted()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);

        var job = await UploadAsync(host.Client, fixture.Account.Id, "dkb-synthetic.csv");
        job = await WaitForAsync(host.Client, job.Id, ImportJobStatus.NeedsMapping);
        await Assert.That(job.ProposedMappingSource).IsEqualTo(MappingSource.Suggestion);
        using (var preview = await host.Client.GetAsync($"/api/imports/{job.Id}/preview"))
        {
            await Assert.That(preview.StatusCode).IsEqualTo(HttpStatusCode.OK);
        }

        using var confirmed = await host.Client.PostAsJsonAsync($"/api/imports/{job.Id}/mapping", job.ProposedMapping, Json);
        await Assert.That(confirmed.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        job = await WaitForAsync(host.Client, job.Id, ImportJobStatus.NeedsReview);
        await Assert.That(job.FullMonths).IsEquivalentTo(new[] { October });
        await Assert.That(job.EdgeMonths).IsEquivalentTo(new[] { September, November });
        var candidates = await host.Client.GetFromJsonAsync<List<ImportCandidateResponse>>($"/api/imports/{job.Id}/candidates", Json);
        await Assert.That(candidates!.Count).IsEqualTo(8);

        job = await CommitAsync(host.Client, job.Id, [November]);
        var again = await CommitAsync(host.Client, job.Id, [November]);

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
    public async Task ReimportingAMonthKeepsCorrectionsAndAppliesRememberedMerchants()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        await ImportDkbSampleAsync(host.Client, fixture.Account.Id, confirmMapping: true);

        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var rent = await dbContext.Transactions.Where(item => item.Amount == -750m).OrderBy(item => item.BookingKey).FirstAsync();
            var rewe = await dbContext.Transactions.SingleAsync(item => item.Amount == -41.10m);
            using var corrected = await host.Client.PutAsJsonAsync($"/api/transactions/{rent.Id}/category", new CategorizeTransactionRequest(HousingId, false), Json);
            using var remembered = await host.Client.PutAsJsonAsync($"/api/transactions/{rewe.Id}/category", new CategorizeTransactionRequest(GroceriesId, true), Json);
            await Assert.That(corrected.StatusCode).IsEqualTo(HttpStatusCode.OK);
            var rememberedResult = await remembered.Content.ReadFromJsonAsync<CategorizeTransactionResponse>(Json);
            // The pending REWE booking in November gets the remembered category too.
            await Assert.That(rememberedResult!.AppliedToOthers).IsEqualTo(1);
        }

        // The confirmed profile is used, so the second import needs no mapping step.
        await ImportDkbSampleAsync(host.Client, fixture.Account.Id, confirmMapping: false);

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
        await ImportDkbSampleAsync(host.Client, fixture.Account.Id, confirmMapping: true);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var rent = await dbContext.Transactions.Where(item => item.Amount == -750m).OrderBy(item => item.BookingKey).FirstAsync();

        using var wrong = await host.Client.PutAsJsonAsync($"/api/transactions/{rent.Id}/category", new CategorizeTransactionRequest(HousingId, true, "gehalt"), Json);
        using var remembered = await host.Client.PutAsJsonAsync($"/api/transactions/{rent.Id}/category", new CategorizeTransactionRequest(HousingId, true, "Miete"), Json);
        var result = await remembered.Content.ReadFromJsonAsync<CategorizeTransactionResponse>(Json);

        await Assert.That(wrong.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        await Assert.That(result!.Transaction.RememberKeywords).Contains("miete");
        await Assert.That(result.AppliedToOthers).IsEqualTo(1);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var rule = await verification.CategoryRules.SingleAsync();
        await Assert.That(rule.Scope).IsEqualTo(CategoryRuleScope.Keyword);
        await Assert.That(rule.Label).IsEqualTo("miete");
    }

    [Test]
    public async Task UnknownFormatsAreDetectedByTheAiAndKnownProfilesSkipIt()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var chat = new CountingChatClient(
            """
            {"dateColumn":0,"dateFormat":"dd.MM.yyyy","amountColumn":3,"debitColumn":-1,"creditColumn":-1,"decimalSeparator":",",
             "counterpartyColumn":1,"payerColumn":-1,"purposeColumn":2,"counterpartyIbanColumn":-1,"creditorIdColumn":-1,
             "statusColumn":-1,"bookingTypeColumn":-1}
            """);
        await using var host = await SpaceApiHost.StartAsync(
            fixture.User.AuthId,
            jobsEnabled: true,
            services => services.AddSingleton<IChatClient>(chat),
            new Dictionary<string, string?> { ["Ai:Enabled"] = "true", ["Ai:ApiKey"] = "test-key" });
        // Column names the heuristic does not know.
        var file = "Wann;Wer;Wofür;Wieviel\n01.10.2026;Bäckerei;Brötchen;-3,20\n15.10.2026;Kino;Film;-12,00\n02.11.2026;Markt;Obst;-5,10\n"u8.ToArray();

        var first = await UploadBytesAsync(host.Client, fixture.Account.Id, file);
        first = await WaitForAsync(host.Client, first.Id, ImportJobStatus.NeedsMapping);
        await Assert.That(first.ProposedMappingSource).IsEqualTo(MappingSource.Ai);
        await Assert.That(first.ProposedMapping!.AmountColumn).IsEqualTo(3);
        using var confirmed = await host.Client.PostAsJsonAsync($"/api/imports/{first.Id}/mapping", first.ProposedMapping, Json);
        await WaitForAsync(host.Client, first.Id, ImportJobStatus.NeedsReview);
        using var cancelled = await host.Client.PostAsync($"/api/imports/{first.Id}/cancel", null);

        var second = await UploadBytesAsync(host.Client, fixture.Account.Id, file);
        second = await WaitForAsync(host.Client, second.Id, ImportJobStatus.NeedsReview);

        await Assert.That(second.ProposedMappingSource).IsEqualTo(MappingSource.Profile);
        await Assert.That(chat.Calls).IsEqualTo(1);
        await Assert.That(chat.LastRequest).DoesNotContain("Bäckerei");
    }

    [Test]
    public async Task UnreachableAiFallsBackToTheColumnNameSuggestion()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(
            fixture.User.AuthId,
            jobsEnabled: true,
            services => services.AddSingleton<IChatClient>(new CountingChatClient(null)),
            new Dictionary<string, string?> { ["Ai:Enabled"] = "true", ["Ai:ApiKey"] = "test-key" });

        var job = await UploadAsync(host.Client, fixture.Account.Id, "generic-comma.csv");
        job = await WaitForAsync(host.Client, job.Id, ImportJobStatus.NeedsMapping);

        await Assert.That(job.ProposedMappingSource).IsEqualTo(MappingSource.Suggestion);
        await Assert.That(job.AiUnavailable).IsTrue();
    }

    [Test]
    public async Task TheAiOnlySeesWhatThePreviewShowsAndNeverOverridesManualCategories()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var chat = new CategorizingChatClient("Groceries");
        await using var host = await StartWithAiAsync(fixture, chat);
        using var settings = await host.Client.PutAsJsonAsync("/api/imports/settings", new UpdateImportSettingsRequest(PurposeRetention.Keep, AiDataSharing.Strict), Json);
        await Assert.That(settings.StatusCode).IsEqualTo(HttpStatusCode.OK);

        var job = await UploadAndReadAsync(host.Client, fixture.Account.Id);

        // Nothing is sent before the user starts it from the preview.
        await Assert.That(chat.Requests).IsEmpty();
        var preview = (await host.Client.GetFromJsonAsync<AiPreviewResponse>($"/api/imports/{job.Id}/ai-preview", Json))!;
        await Assert.That(preview.Items.Count).IsEqualTo(5);
        var bakery = preview.Items.Single(item => item.Counterparty == "Bäckerei Schön");
        using var deselected = await host.Client.PutAsJsonAsync($"/api/imports/{job.Id}/ai-preview/{bakery.Key}", new UpdateAiPreviewItemRequest(true), Json);
        await Assert.That(deselected.StatusCode).IsEqualTo(HttpStatusCode.OK);

        using var started = await host.Client.PostAsJsonAsync($"/api/imports/{job.Id}/categorize", new CategorizeImportRequest(), Json);
        await Assert.That(started.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        job = await WaitForAsync(host.Client, job.Id, ImportJobStatus.NeedsReview);

        var rows = await GetCandidatesAsync(host.Client, job.Id);
        var salary = rows.Single(row => row.Amount > 0);
        var bakeryRow = rows.Single(row => row.Counterparty == "Bäckerei Schön");
        var others = rows.Where(row => row.Amount < 0 && row.Id != bakeryRow.Id).ToList();
        await Assert.That(others.Select(row => (row.CategorySource, row.CategoryId))).IsEquivalentTo(others.Select(_ => ((CategorySource?)CategorySource.Ai, (Guid?)GroceriesId)));
        await Assert.That(bakeryRow.CategoryId).IsNull();
        await Assert.That(salary.CategoryId).IsNull();
        await Assert.That(job.AiCategorizedCount).IsEqualTo(others.Count);
        // The request holds exactly the selected preview texts and no amounts, dates, IBANs or the customer's name.
        var sent = string.Join('\n', chat.Requests);
        foreach (var item in preview.Items.Where(item => item.Key != bakery.Key))
        {
            await Assert.That(sent).Contains(item.Counterparty!);
        }

        foreach (var secret in new[] { "Bäckerei", "Erika", "Beispiel", "DE00", "REF-0001", "-6,80", "30.11.2026" })
        {
            await Assert.That(sent.Contains(secret, StringComparison.Ordinal)).IsFalse();
        }

        // A manual category survives categorizing again.
        using var chosen = await host.Client.PutAsJsonAsync($"/api/imports/{job.Id}/candidates/{salary.Id}", new UpdateImportCandidateRequest(HousingId, false), Json);
        using var again = await host.Client.PostAsJsonAsync($"/api/imports/{job.Id}/categorize", new CategorizeImportRequest(), Json);
        await Assert.That(again.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        await WaitForAsync(host.Client, job.Id, ImportJobStatus.NeedsReview);
        var after = await GetCandidatesAsync(host.Client, job.Id);
        await Assert.That(after.Single(row => row.Id == salary.Id).CategorySource).IsEqualTo(CategorySource.Manual);
        await Assert.That(after.Single(row => row.Id == salary.Id).CategoryId).IsEqualTo(HousingId);
    }

    [Test]
    public async Task NothingIsSentWhileSharingIsOffOrTheUserTurnedAiOff()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var chat = new CategorizingChatClient("Groceries");
        await using var host = await StartWithAiAsync(fixture, chat);

        var off = await UploadAndReadAsync(host.Client, fixture.Account.Id);
        using var refused = await host.Client.PostAsJsonAsync($"/api/imports/{off.Id}/categorize", new CategorizeImportRequest(), Json);
        await Assert.That(refused.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        using var cancelled = await host.Client.PostAsync($"/api/imports/{off.Id}/cancel", null);

        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            (await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id)).SetAiEnabled(false);
            await dbContext.SaveChangesAsync();
        }

        var switchedOff = await UploadAndReadAsync(host.Client, fixture.Account.Id);
        // Even an explicit choice for this import is refused while the user turned AI off.
        using var rejected = await host.Client.PostAsJsonAsync($"/api/imports/{switchedOff.Id}/categorize", new CategorizeImportRequest(AiDataSharing.Strict), Json);

        await Assert.That(rejected.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await Assert.That(chat.Requests).IsEmpty();
    }

    [Test]
    public async Task AnUnreachableAiKeepsAllRowsUncategorized()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var chat = new CategorizingChatClient(null);
        await using var host = await StartWithAiAsync(fixture, chat);

        var job = await UploadAndReadAsync(host.Client, fixture.Account.Id);
        using var started = await host.Client.PostAsJsonAsync($"/api/imports/{job.Id}/categorize", new CategorizeImportRequest(AiDataSharing.Strict), Json);
        job = await WaitForAsync(host.Client, job.Id, ImportJobStatus.NeedsReview);

        await Assert.That(job.AiCategorizationUnavailable).IsTrue();
        await Assert.That(job.AiDataSharing).IsEqualTo(AiDataSharing.Strict);
        var rows = await GetCandidatesAsync(host.Client, job.Id);
        await Assert.That(rows.Count(row => row.Errors is null)).IsEqualTo(5);
        await Assert.That(rows.Any(row => row.CategoryId is not null)).IsFalse();
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

        var job = await UploadBytesAsync(host.Client, fixture.Account.Id, file);
        job = await WaitForAsync(host.Client, job.Id, ImportJobStatus.NeedsMapping);
        using var confirmed = await host.Client.PostAsJsonAsync($"/api/imports/{job.Id}/mapping", job.ProposedMapping, Json);
        job = await WaitForAsync(host.Client, job.Id, ImportJobStatus.NeedsReview);
        var rows = await GetCandidatesAsync(host.Client, job.Id);
        var statements = rows.Where(row => row.IsCardSettlement).ToList();
        await Assert.That(statements.Count).IsEqualTo(2);
        await Assert.That(rows.Single(row => row.Counterparty == "Bäckerei").IsCardSettlement).IsFalse();

        var offset = statements.Single(row => row.Amount == -420m);
        using var updated = await host.Client.PutAsJsonAsync($"/api/imports/{job.Id}/candidates/{offset.Id}", new UpdateImportCandidateRequest(null, false, true), Json);
        await Assert.That(updated.StatusCode).IsEqualTo(HttpStatusCode.OK);
        // The file covers only part of October, which is therefore an edge month to include explicitly.
        await CommitAsync(host.Client, job.Id, [October]);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var transactions = await verification.Transactions.Where(item => item.AccountId == fixture.Account.Id).ToListAsync();
        await Assert.That(transactions.Single(item => item.Amount == -420m).IsTransfer).IsTrue();
        await Assert.That(transactions.Single(item => item.Amount == -80m).IsTransfer).IsFalse();
    }

    [Test]
    public async Task DataMinimizingSpacesStoreNeitherPersonsNorCounterpartyKeys()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        using var settings = await host.Client.PutAsJsonAsync("/api/imports/settings", new UpdateImportSettingsRequest(PurposeRetention.Keep, MinimizeData: true), Json);
        var saved = await settings.Content.ReadFromJsonAsync<ImportSettingsResponse>(Json);
        await Assert.That(saved!.MinimizeData).IsTrue();

        await ImportDkbSampleAsync(host.Client, fixture.Account.Id, confirmMapping: true);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var transactions = await verification.Transactions.Where(item => item.AccountId == fixture.Account.Id).ToListAsync();
        await Assert.That(transactions.Count).IsEqualTo(7);
        await Assert.That(transactions.All(item => item.CounterpartyKey == null && item.BookingKey != null)).IsTrue();
        await Assert.That(transactions.Where(item => item.Amount == -750m).All(item => item.Counterparty == "[PERSON]")).IsTrue();
        await Assert.That(transactions.Any(item => item.Counterparty!.Contains("Mustermann", StringComparison.Ordinal))).IsFalse();
        await Assert.That(transactions.Single(item => item.Amount == -85m).Counterparty).IsEqualTo("Stadtwerke Beispielstadt");

        // Without a counterparty key a transfer can only be remembered by a keyword.
        var rent = transactions.First(item => item.Amount == -750m);
        using var byPerson = await host.Client.PutAsJsonAsync($"/api/transactions/{rent.Id}/category", new CategorizeTransactionRequest(HousingId, true), Json);
        await Assert.That(byPerson.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }

    private static Task<SpaceApiHost> StartWithAiAsync(Fixture fixture, IChatClient chat) =>
        SpaceApiHost.StartAsync(
            fixture.User.AuthId,
            jobsEnabled: true,
            services => services.AddSingleton(chat),
            new Dictionary<string, string?> { ["Ai:Enabled"] = "true", ["Ai:ApiKey"] = "test-key" });

    private static async Task<ImportJobResponse> UploadAndReadAsync(HttpClient client, Guid accountId)
    {
        var job = await UploadAsync(client, accountId, "ing-synthetic.csv");
        // A confirmed profile of an earlier import skips the mapping step.
        while (job.Status is ImportJobStatus.Pending or ImportJobStatus.Analyzing)
        {
            await Task.Delay(100);
            job = (await client.GetFromJsonAsync<ImportJobResponse>($"/api/imports/{job.Id}", Json))!;
        }

        if (job.Status == ImportJobStatus.NeedsMapping)
        {
            using var confirmed = await client.PostAsJsonAsync($"/api/imports/{job.Id}/mapping", job.ProposedMapping, Json);
        }

        return await WaitForAsync(client, job.Id, ImportJobStatus.NeedsReview);
    }

    private static async Task<List<ImportCandidateResponse>> GetCandidatesAsync(HttpClient client, Guid id) =>
        (await client.GetFromJsonAsync<List<ImportCandidateResponse>>($"/api/imports/{id}/candidates", Json))!;

    [Test]
    public async Task CancellingDeletesTheFileRightAway()
    {
        var fixture = await CreateFixtureAsync("Member");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        var job = await UploadAsync(host.Client, fixture.Account.Id, "ing-synthetic.csv");
        job = await WaitForAsync(host.Client, job.Id, ImportJobStatus.NeedsMapping);

        using var cancelled = await host.Client.PostAsync($"/api/imports/{job.Id}/cancel", null);
        using var uploadAgain = await UploadResponseAsync(host.Client, fixture.Account.Id, "ing-synthetic.csv");

        await Assert.That(cancelled.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(uploadAgain.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.ImportFiles.AnyAsync(item => item.ImportJobId == job.Id)).IsFalse();
        await Assert.That((await verification.ImportJobs.SingleAsync(item => item.Id == job.Id)).Status).IsEqualTo(ImportJobStatus.Cancelled);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.Accepted)]
    [Arguments("Member", HttpStatusCode.Accepted)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task UploadingRequiresImportPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);

        using var response = await UploadResponseAsync(host.Client, fixture.Account.Id, "generic-comma.csv");

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    public async Task CashAccountsCannotBeImportedInto()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var cash = await dbContext.Accounts.SingleAsync(item => item.SpaceId == fixture.Account.SpaceId && item.Kind == AccountKind.Cash);

        using var response = await UploadResponseAsync(host.Client, cash.Id, "generic-comma.csv");

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
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

    [Test]
    public async Task PseudonymousKeysAreStablePerSpaceAndDifferBetweenSpaces()
    {
        var pseudonymizer = new HmacPseudonymizer(Options.Create(new FingerprintOptions { MasterKey = SpaceApiHost.TestFingerprintKey }));
        var first = Guid.NewGuid();
        var second = Guid.NewGuid();

        var key = pseudonymizer.Compute(first, "iban", "DE89370400440532013000");

        await Assert.That(pseudonymizer.Compute(first, "iban", "DE89370400440532013000")).IsEqualTo(key);
        await Assert.That(pseudonymizer.Compute(second, "iban", "DE89370400440532013000")).IsNotEqualTo(key);
        await Assert.That(pseudonymizer.Compute(first, "booking", "DE89370400440532013000")).IsNotEqualTo(key);
        await Assert.That(key.Contains("DE89", StringComparison.Ordinal)).IsFalse();
    }

    private static async Task ImportDkbSampleAsync(HttpClient client, Guid accountId, bool confirmMapping)
    {
        var job = await UploadAsync(client, accountId, "dkb-synthetic.csv");
        if (confirmMapping)
        {
            job = await WaitForAsync(client, job.Id, ImportJobStatus.NeedsMapping);
            using var confirmed = await client.PostAsJsonAsync($"/api/imports/{job.Id}/mapping", job.ProposedMapping, Json);
            await Assert.That(confirmed.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        }

        job = await WaitForAsync(client, job.Id, ImportJobStatus.NeedsReview);
        await CommitAsync(client, job.Id, [November]);
    }

    private static async Task<ImportJobResponse> CommitAsync(HttpClient client, Guid id, List<DateOnly> includedEdgeMonths)
    {
        using var response = await client.PostAsJsonAsync($"/api/imports/{id}/commit", new CommitImportRequest(includedEdgeMonths, false), Json);
        if (response.StatusCode != HttpStatusCode.OK)
        {
            throw new InvalidOperationException($"Commit failed: {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }

        return (await response.Content.ReadFromJsonAsync<ImportJobResponse>(Json))!;
    }

    private static async Task<ImportJobResponse> UploadAsync(HttpClient client, Guid accountId, string sample)
    {
        using var response = await UploadResponseAsync(client, accountId, sample);
        if (response.StatusCode != HttpStatusCode.Accepted)
        {
            throw new InvalidOperationException($"Upload failed: {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }

        return (await response.Content.ReadFromJsonAsync<ImportJobResponse>(Json))!;
    }

    private static async Task<ImportJobResponse> UploadBytesAsync(HttpClient client, Guid accountId, byte[] content)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(accountId.ToString()), "accountId");
        form.Add(new ByteArrayContent(content), "file", "export.csv");
        using var response = await client.PostAsync("/api/imports", form);
        if (response.StatusCode != HttpStatusCode.Accepted)
        {
            throw new InvalidOperationException($"Upload failed: {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }

        return (await response.Content.ReadFromJsonAsync<ImportJobResponse>(Json))!;
    }

    private static async Task<HttpResponseMessage> UploadResponseAsync(HttpClient client, Guid accountId, string sample)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(accountId.ToString()), "accountId");
        var file = new ByteArrayContent(await File.ReadAllBytesAsync(Path.Combine(AppContext.BaseDirectory, "Samples", sample)));
        file.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        form.Add(file, "file", sample);
        return await client.PostAsync("/api/imports", form);
    }

    private static async Task<ImportJobResponse> WaitForAsync(HttpClient client, Guid id, ImportJobStatus status)
    {
        for (var attempt = 0; attempt < 120; attempt++)
        {
            var job = (await client.GetFromJsonAsync<ImportJobResponse>($"/api/imports/{id}", Json))!;
            if (job.Status == status)
            {
                return job;
            }

            if (job.Status is ImportJobStatus.Failed or ImportJobStatus.Cancelled or ImportJobStatus.Done)
            {
                throw new InvalidOperationException($"Import ended as {job.Status} ({job.Error}) instead of {status}");
            }

            await Task.Delay(250);
        }

        throw new TimeoutException($"Import did not reach {status}");
    }

    private static async Task<Fixture> CreateFixtureAsync(string roleName)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Import space");
        var role = await dbContext.Roles.SingleAsync(item => item.Name == roleName);
        var user = User.Init("importer-auth", "importer", "importer@example.test");
        user.CompleteOnboarding("importer", AnalyticsConsent.Declined, DateTime.UtcNow);
        user.UserSpaces.Add(UserSpace.Create(user, space, role, isActive: true));
        var account = Account.Create("Giro", "3000", space);
        dbContext.AddRange(user, account);
        await dbContext.SaveChangesAsync();
        return new Fixture(user, account);
    }

    private sealed record Fixture(User User, Account Account);
    /// <summary>Answers with a fixed text and counts calls; throws when the text is null.</summary>
    private sealed class CountingChatClient(string? answer) : IChatClient
    {
        private int _calls;

        public int Calls => _calls;

        public string LastRequest { get; private set; } = string.Empty;

        public Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
        {
            Interlocked.Increment(ref _calls);
            LastRequest = string.Join('\n', messages.Select(message => message.Text));
            return answer is null
                ? throw new HttpRequestException("unavailable")
                : Task.FromResult(new ChatResponse(new ChatMessage(ChatRole.Assistant, answer)));
        }

        public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public object? GetService(Type serviceType, object? serviceKey = null) => null;

        public void Dispose()
        {
        }
    }

    /// <summary>
    /// Plays the AI: refuses format detection, assigns every outgoing item to one category and records every request.
    /// A null category name makes the provider unavailable.
    /// </summary>
    private sealed class CategorizingChatClient(string? categoryName) : IChatClient
    {
        private readonly List<string> _requests = [];

        public IReadOnlyList<string> Requests
        {
            get
            {
                lock (_requests)
                {
                    return [.. _requests];
                }
            }
        }

        public Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
        {
            var text = string.Join('\n', messages.Select(message => message.Text));
            if (!text.Contains("\"items\"", StringComparison.Ordinal))
            {
                // Format detection: answer with something the mapping check rejects.
                return Task.FromResult(new ChatResponse(new ChatMessage(ChatRole.Assistant, "{}")));
            }

            lock (_requests)
            {
                _requests.Add(text);
            }

            if (categoryName is null)
            {
                throw new HttpRequestException("unavailable");
            }

            using var data = JsonDocument.Parse(text[(text.LastIndexOf("<data>", StringComparison.Ordinal) + 6)..text.LastIndexOf("</data>", StringComparison.Ordinal)]);
            var category = data.RootElement.GetProperty("categories").EnumerateArray()
                .Single(item => item.GetProperty("name").GetString() == categoryName).GetProperty("index").GetInt32();
            var results = data.RootElement.GetProperty("items").EnumerateArray()
                .Select(item => new { id = item.GetProperty("id").GetInt32(), category = item.GetProperty("incoming").GetBoolean() ? -1 : category });
            return Task.FromResult(new ChatResponse(new ChatMessage(ChatRole.Assistant, JsonSerializer.Serialize(new { results }))));
        }

        public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public object? GetService(Type serviceType, object? serviceKey = null) => null;

        public void Dispose()
        {
        }
    }
}
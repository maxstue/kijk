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

        var first = await UploadBytesAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, file);
        first = await WaitForAsync(host.Client, fixture.Account.SpaceId, first.Id, ImportJobStatus.NeedsMapping);
        await Assert.That(first.ProposedMappingSource).IsEqualTo(MappingSource.Ai);
        await Assert.That(first.ProposedMapping!.AmountColumn).IsEqualTo(3);
        using var confirmed = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{first.Id}/mapping", first.ProposedMapping, Json);
        await WaitForAsync(host.Client, fixture.Account.SpaceId, first.Id, ImportJobStatus.NeedsReview);
        using var cancelled = await host.Client.PostAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{first.Id}/cancel", null);

        var second = await UploadBytesAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, file);
        second = await WaitForAsync(host.Client, fixture.Account.SpaceId, second.Id, ImportJobStatus.NeedsReview);

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

        var job = await UploadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "generic-comma.csv");
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsMapping);

        await Assert.That(job.ProposedMappingSource).IsEqualTo(MappingSource.Suggestion);
        await Assert.That(job.AiUnavailable).IsTrue();
    }


    [Test]
    public async Task TheAiOnlySeesWhatThePreviewShowsAndNeverOverridesManualCategories()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var chat = new CategorizingChatClient("Groceries");
        await using var host = await StartWithAiAsync(fixture, chat);
        using var settings = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/settings", new UpdateImportSettingsRequest(PurposeRetention.Keep, AiDataSharing.Strict), Json);
        await Assert.That(settings.StatusCode).IsEqualTo(HttpStatusCode.OK);

        var job = await UploadAndReadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id);

        // Nothing is sent before the user starts it from the preview.
        await Assert.That(chat.Requests).IsEmpty();
        var preview = (await host.Client.GetFromJsonAsync<AiPreviewResponse>($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/ai-preview", Json))!;
        await Assert.That(preview.Items.Count).IsEqualTo(5);
        var bakery = preview.Items.Single(item => item.Counterparty == "Bäckerei Schön");
        var selectedKeys = preview.Items.Where(item => item.Key != bakery.Key).Select(item => item.Key).ToList();
        using var started = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/categorize", new CategorizeImportRequest(SelectedTextKeys: selectedKeys), Json);
        await Assert.That(started.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsReview);

        var rows = await GetCandidatesAsync(host.Client, fixture.Account.SpaceId, job.Id);
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
        using var chosen = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/candidates/{salary.Id}", new UpdateImportCandidateRequest(HousingId, false), Json);
        using var again = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/categorize", new CategorizeImportRequest(), Json);
        await Assert.That(again.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsReview);
        var after = await GetCandidatesAsync(host.Client, fixture.Account.SpaceId, job.Id);
        await Assert.That(after.Single(row => row.Id == salary.Id).CategorySource).IsEqualTo(CategorySource.Manual);
        await Assert.That(after.Single(row => row.Id == salary.Id).CategoryId).IsEqualTo(HousingId);
    }


    [Test]
    public async Task InvalidAiSelectionsDoNotStartAJobOrChangeThePreview()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var chat = new CategorizingChatClient("Groceries");
        await using var host = await StartWithAiAsync(fixture, chat);
        var job = await UploadAndReadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id);
        using var empty = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/categorize", new CategorizeImportRequest(AiDataSharing.Strict, []), Json);
        await Assert.That(empty.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        using var stale = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/categorize", new CategorizeImportRequest(AiDataSharing.Strict, ["0000000000000000"]), Json);
        await Assert.That(stale.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        var unchanged = (await host.Client.GetFromJsonAsync<ImportJobResponse>($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}", Json))!;
        await Assert.That(unchanged.Status).IsEqualTo(ImportJobStatus.NeedsReview);
        var preview = (await host.Client.GetFromJsonAsync<AiPreviewResponse>($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/ai-preview", Json))!;
        await Assert.That(preview.Items.All(item => !item.Excluded)).IsTrue();
        await Assert.That(chat.Requests).IsEmpty();
    }


    [Test]
    public async Task TheSubmittedAiSelectionCanIncludeAPreviouslyExcludedText()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var chat = new CategorizingChatClient("Groceries");
        await using var host = await StartWithAiAsync(fixture, chat);
        var job = await UploadAndReadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id);
        var preview = (await host.Client.GetFromJsonAsync<AiPreviewResponse>($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/ai-preview", Json))!;
        var bakery = preview.Items.Single(item => item.Counterparty == "Bäckerei Schön");
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var row = await dbContext.ImportCandidates.SingleAsync(item => item.ImportJobId == job.Id && item.Counterparty == "Bäckerei Schön");
            row.SetAiExcluded(true);
            await dbContext.SaveChangesAsync();
        }
        using var started = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/categorize", new CategorizeImportRequest(AiDataSharing.Strict, [bakery.Key]), Json);
        await Assert.That(started.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsReview);
        var rows = await GetCandidatesAsync(host.Client, fixture.Account.SpaceId, job.Id);
        await Assert.That(rows.Single(row => row.Counterparty == "Bäckerei Schön").CategoryId).IsEqualTo(GroceriesId);
        await Assert.That(rows.Where(row => row.Counterparty != "Bäckerei Schön").All(row => row.CategoryId is null)).IsTrue();
    }


    [Test]
    public async Task NothingIsSentWhileSharingIsOffOrTheUserTurnedAiOff()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var chat = new CategorizingChatClient("Groceries");
        await using var host = await StartWithAiAsync(fixture, chat);

        var off = await UploadAndReadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id);
        using var refused = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{off.Id}/categorize", new CategorizeImportRequest(), Json);
        await Assert.That(refused.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        using var cancelled = await host.Client.PostAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{off.Id}/cancel", null);

        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            (await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id)).SetAiEnabled(false);
            await dbContext.SaveChangesAsync();
        }

        var switchedOff = await UploadAndReadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id);
        // Even an explicit choice for this import is refused while the user turned AI off.
        using var rejected = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{switchedOff.Id}/categorize", new CategorizeImportRequest(AiDataSharing.Strict), Json);

        await Assert.That(rejected.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await Assert.That(chat.Requests).IsEmpty();
    }


    [Test]
    public async Task AnUnreachableAiKeepsAllRowsUncategorized()
    {
        var fixture = await CreateFixtureAsync("Admin");
        var chat = new CategorizingChatClient(null);
        await using var host = await StartWithAiAsync(fixture, chat);

        var job = await UploadAndReadAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id);
        using var started = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/{job.Id}/categorize", new CategorizeImportRequest(AiDataSharing.Strict), Json);
        job = await WaitForAsync(host.Client, fixture.Account.SpaceId, job.Id, ImportJobStatus.NeedsReview);

        await Assert.That(job.AiCategorizationUnavailable).IsTrue();
        await Assert.That(job.AiDataSharing).IsEqualTo(AiDataSharing.Strict);
        var rows = await GetCandidatesAsync(host.Client, fixture.Account.SpaceId, job.Id);
        await Assert.That(rows.Count(row => row.Errors is null)).IsEqualTo(5);
        await Assert.That(rows.Any(row => row.CategoryId is not null)).IsFalse();
    }


    private static Task<SpaceApiHost> StartWithAiAsync(Fixture fixture, IChatClient chat) =>
        SpaceApiHost.StartAsync(
            fixture.User.AuthId,
            jobsEnabled: true,
            services => services.AddSingleton(chat),
            new Dictionary<string, string?> { ["Ai:Enabled"] = "true", ["Ai:ApiKey"] = "test-key" });


    private static async Task<ImportJobResponse> UploadAndReadAsync(HttpClient client, Guid spaceId, Guid accountId)
    {
        var job = await UploadAsync(client, spaceId, accountId, "ing-synthetic.csv");
        // A confirmed profile of an earlier import skips the mapping step.
        var attempts = 0;
        while (job.Status is ImportJobStatus.Pending or ImportJobStatus.Analyzing)
        {
            if (++attempts > 120)
            {
                throw new TimeoutException($"Import stayed in {job.Status} instead of becoming ready for mapping or review");
            }
            await Task.Delay(100);
            job = (await client.GetFromJsonAsync<ImportJobResponse>($"/api/spaces/{spaceId}/imports/{job.Id}", Json))!;
        }

        if (job.Status == ImportJobStatus.NeedsMapping)
        {
            using var confirmed = await client.PostAsJsonAsync($"/api/spaces/{spaceId}/imports/{job.Id}/mapping", job.ProposedMapping, Json);
        }

        return await WaitForAsync(client, spaceId, job.Id, ImportJobStatus.NeedsReview);
    }


    private static async Task<List<ImportCandidateResponse>> GetCandidatesAsync(HttpClient client, Guid spaceId, Guid id) =>
        (await client.GetFromJsonAsync<ImportCandidatePageResponse>($"/api/spaces/{spaceId}/imports/{id}/candidates", Json))!.Items;

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
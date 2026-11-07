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

// Runs the whole import over HTTP with the real Wolverine durable queue, Data Protection and Postgres.
[NotInParallel]
public partial class ImportHttpTests
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

    private static async Task ImportDkbSampleAsync(HttpClient client, Guid spaceId, Guid accountId, bool confirmMapping)
    {
        var job = await UploadAsync(client, spaceId, accountId, "dkb-synthetic.csv");
        if (confirmMapping)
        {
            job = await WaitForAsync(client, spaceId, job.Id, ImportJobStatus.NeedsMapping);
            using var confirmed = await client.PostAsJsonAsync($"/api/spaces/{spaceId}/imports/{job.Id}/mapping", job.ProposedMapping, Json);
            await Assert.That(confirmed.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        }

        job = await WaitForAsync(client, spaceId, job.Id, ImportJobStatus.NeedsReview);
        await CommitAsync(client, spaceId, job.Id, [November]);
    }

    private static async Task<ImportJobResponse> CommitAsync(HttpClient client, Guid spaceId, Guid id, List<DateOnly> includedEdgeMonths)
    {
        using var response = await client.PostAsJsonAsync($"/api/spaces/{spaceId}/imports/{id}/commit", new CommitImportRequest(includedEdgeMonths, false), Json);
        if (response.StatusCode != HttpStatusCode.OK)
        {
            throw new InvalidOperationException($"Commit failed: {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }

        return (await response.Content.ReadFromJsonAsync<ImportJobResponse>(Json))!;
    }

    private static async Task<ImportJobResponse> UploadAsync(HttpClient client, Guid spaceId, Guid accountId, string sample)
    {
        using var response = await UploadResponseAsync(client, spaceId, accountId, sample);
        if (response.StatusCode != HttpStatusCode.Accepted)
        {
            throw new InvalidOperationException($"Upload failed: {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }

        return (await response.Content.ReadFromJsonAsync<ImportJobResponse>(Json))!;
    }

    private static async Task<ImportJobResponse> UploadBytesAsync(HttpClient client, Guid spaceId, Guid accountId, byte[] content)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(accountId.ToString()), "accountId");
        form.Add(new ByteArrayContent(content), "file", "export.csv");
        using var response = await client.PostAsync($"/api/spaces/{spaceId}/imports", form);
        if (response.StatusCode != HttpStatusCode.Accepted)
        {
            throw new InvalidOperationException($"Upload failed: {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }

        return (await response.Content.ReadFromJsonAsync<ImportJobResponse>(Json))!;
    }

    private static async Task<HttpResponseMessage> UploadResponseAsync(HttpClient client, Guid spaceId, Guid accountId, string sample)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(accountId.ToString()), "accountId");
        var file = new ByteArrayContent(await File.ReadAllBytesAsync(Path.Combine(AppContext.BaseDirectory, "Samples", sample)));
        file.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        form.Add(file, "file", sample);
        return await client.PostAsync($"/api/spaces/{spaceId}/imports", form);
    }

    private static async Task<ImportJobResponse> WaitForAsync(HttpClient client, Guid spaceId, Guid id, ImportJobStatus status)
    {
        for (var attempt = 0; attempt < 120; attempt++)
        {
            var job = (await client.GetFromJsonAsync<ImportJobResponse>($"/api/spaces/{spaceId}/imports/{id}", Json))!;
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
        user.SetSensitiveDataConsent(true, DateTime.UtcNow);
        user.SetAiEnabled(true);
        user.UserSpaces.Add(UserSpace.Create(user, space, role));
        var account = Account.Create("Giro", "3000", space);
        dbContext.AddRange(user, account);
        await dbContext.SaveChangesAsync();
        return new Fixture(user, account);
    }

    private sealed record Fixture(User User, Account Account);
}
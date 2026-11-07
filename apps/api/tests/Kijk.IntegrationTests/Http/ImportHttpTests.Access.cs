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
    public async Task DataMinimizingSpacesStoreNeitherPersonsNorCounterpartyKeys()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        using var settings = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/imports/settings", new UpdateImportSettingsRequest(PurposeRetention.Keep, MinimizeData: true), Json);
        var saved = await settings.Content.ReadFromJsonAsync<ImportSettingsResponse>(Json);
        await Assert.That(saved!.MinimizeData).IsTrue();

        await ImportDkbSampleAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, confirmMapping: true);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var transactions = await verification.Transactions.Where(item => item.AccountId == fixture.Account.Id).ToListAsync();
        await Assert.That(transactions.Count).IsEqualTo(7);
        await Assert.That(transactions.All(item => item.CounterpartyKey == null && item.BookingKey != null)).IsTrue();
        await Assert.That(transactions.Where(item => item.Amount == -750m).All(item => item.Counterparty == "[PERSON]")).IsTrue();
        await Assert.That(transactions.Any(item => item.Counterparty!.Contains("Mustermann", StringComparison.Ordinal))).IsFalse();
        await Assert.That(transactions.Single(item => item.Amount == -85m).Counterparty).IsEqualTo("Stadtwerke Beispielstadt");

        // Without a counterparty key a transfer can only be remembered by a keyword.
        var rent = transactions.First(item => item.Amount == -750m);
        using var byPerson = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Account.SpaceId}/transactions/{rent.Id}/category", new CategorizeTransactionRequest(HousingId, true), Json);
        await Assert.That(byPerson.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }


    [Test]
    [Arguments("Admin", HttpStatusCode.Accepted)]
    [Arguments("Member", HttpStatusCode.Accepted)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task UploadingRequiresImportPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);

        using var response = await UploadResponseAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "generic-comma.csv");

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }


    [Test]
    public async Task UploadingRequiresConsentToProcessSensitiveData()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId, jobsEnabled: true);
        using var withdrawn = await host.Client.PutAsJsonAsync("/api/users/me", new UpdateUserRequest(null, null, null, null, null, SensitiveDataConsent: false), Json);

        using var refused = await UploadResponseAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "generic-comma.csv");
        using var given = await host.Client.PutAsJsonAsync("/api/users/me", new UpdateUserRequest(null, null, null, null, null, SensitiveDataConsent: true), Json);
        using var accepted = await UploadResponseAsync(host.Client, fixture.Account.SpaceId, fixture.Account.Id, "generic-comma.csv");

        await Assert.That(withdrawn.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(refused.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        await Assert.That(given.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(accepted.StatusCode).IsEqualTo(HttpStatusCode.Accepted);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.ImportJobs.CountAsync()).IsEqualTo(1);
    }


    [Test]
    public async Task CashAccountsCannotBeImportedInto()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var cash = await dbContext.Accounts.SingleAsync(item => item.SpaceId == fixture.Account.SpaceId && item.Kind == AccountKind.Cash);

        using var response = await UploadResponseAsync(host.Client, fixture.Account.SpaceId, cash.Id, "generic-comma.csv");

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }


    [Test]
    public async Task PseudonymousKeysAreStablePerSpaceAndDifferBetweenSpaces()
    {
        var pseudonymizer = new HmacPseudonymizer(Options.Create(new FingerprintOptions { MasterKey = SpaceApiHost.TestFingerprintKey }));
        var first = Guid.NewGuid();
        var second = Guid.NewGuid();

        var key = pseudonymizer.Compute(first, "iban", "DE89370400440532013000");

        await Assert.That(pseudonymizer.Compute(first, "iban", "DE89370400440532013000")).IsEqualTo(key);
        await Assert.That(pseudonymizer.Compute(second, "iban", "DE89370400440532013000")).IsNotEqualTo<string>(key);
        await Assert.That(pseudonymizer.Compute(first, "booking", "DE89370400440532013000")).IsNotEqualTo<string>(key);
        await Assert.That(key.Contains("DE89", StringComparison.Ordinal)).IsFalse();
    }

}
using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Spaces.AcceptInvitation;
using Kijk.Application.Spaces.CreateInvitation;
using Kijk.Application.Spaces.PreviewInvitation;
using Kijk.Application.Spaces.Shared;
using Kijk.Application.Users.CompleteOnboarding;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Serilog.Core;
using Serilog.Events;

namespace Kijk.IntegrationTests.Http;

// People with an invitation link see what it offers and join, either directly or as part of their onboarding.
[NotInParallel]
public class InvitationAcceptanceHttpTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task UsersPreviewAnInvitationAndJoinWithTheInvitedRoleOnce()
    {
        var seed = await SeedAsync();
        await using var host = await SpaceApiHost.StartAsync(seed.Admin.AuthId);
        using var created = await host.Client.PostAsJsonAsync($"/api/spaces/{seed.SpaceId}/invitations", new CreateSpaceInvitationRequest(SpaceRoles.Viewer.Id), Json);
        var token = (await created.Content.ReadFromJsonAsync<CreateSpaceInvitationResponse>(Json))!.Token;
        using var joiner = host.CreateClient(seed.Joiner.AuthId);
        using var latecomer = host.CreateClient(seed.Latecomer.AuthId);

        using var previewed = await joiner.PostAsJsonAsync("/api/invitations/preview", new InvitationTokenRequest(token), Json);
        var preview = (await previewed.Content.ReadFromJsonAsync<InvitationPreviewResponse>(Json))!;
        await Assert.That(previewed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(preview.SpaceName).IsEqualTo("Shared space");
        await Assert.That(preview.RoleId).IsEqualTo(SpaceRoles.Viewer.Id);
        await Assert.That(preview.RoleName).IsEqualTo(SpaceRoles.ViewerName);
        await Assert.That(preview.InvitedByName).IsEqualTo("admin");
        await Assert.That(preview.SpaceId).IsNull();

        using var accepted = await joiner.PostAsJsonAsync("/api/invitations/accept", new InvitationTokenRequest(token), Json);
        var joined = (await accepted.Content.ReadFromJsonAsync<AcceptInvitationResponse>(Json))!;
        await Assert.That(accepted.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(joined.SpaceId).IsEqualTo(seed.SpaceId);
        await Assert.That(joined.RoleId).IsEqualTo(SpaceRoles.Viewer.Id);

        // A used invitation is gone for everyone, including the person who used it.
        using var previewedAgain = await joiner.PostAsJsonAsync("/api/invitations/preview", new InvitationTokenRequest(token), Json);
        using var acceptedByOther = await latecomer.PostAsJsonAsync("/api/invitations/accept", new InvitationTokenRequest(token), Json);
        await Assert.That(previewedAgain.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(acceptedByOther.StatusCode).IsEqualTo(HttpStatusCode.NotFound);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var membership = await verification.UserSpaces.SingleAsync(link => link.UserId == seed.Joiner.Id && link.SpaceId == seed.SpaceId);
        var invitation = await verification.SpaceInvitations.SingleAsync();
        await Assert.That(membership.RoleId).IsEqualTo(SpaceRoles.Viewer.Id);
        await Assert.That(invitation.AcceptedById).IsEqualTo(seed.Joiner.Id);
        await Assert.That(invitation.AcceptedAt).IsNotNull();
        await Assert.That(await verification.UserSpaces.AnyAsync(link => link.UserId == seed.Latecomer.Id && link.SpaceId == seed.SpaceId)).IsFalse();
    }

    [Test]
    public async Task UnusableTokensCannotBeToldApart()
    {
        var seed = await SeedAsync();
        var now = DateTime.UtcNow;
        var expired = await AddInvitationAsync(seed, now - SpaceInvitation.Lifetime - TimeSpan.FromMinutes(1));
        var revoked = await AddInvitationAsync(seed, revoke: true);
        var used = await AddInvitationAsync(seed, acceptedBy: seed.Latecomer);
        var unknown = InvitationToken.Create().Token;
        await using var host = await SpaceApiHost.StartAsync(seed.Joiner.AuthId);
        // Two identities stay below the invitation rate limit.
        using var latecomer = host.CreateClient(seed.Latecomer.AuthId);

        var answers = new List<string>();
        foreach (var token in new[] { expired, revoked, used, unknown, "not-a-token", new string('A', 43) })
        {
            foreach (var operation in new[] { "preview", "accept" })
            {
                var client = operation == "preview" ? host.Client : latecomer;
                using var response = await client.PostAsJsonAsync($"/api/invitations/{operation}", new InvitationTokenRequest(token), Json);
                var problem = await response.Content.ReadFromJsonAsync<JsonElement>(Json);
                await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
                answers.Add($"{problem.GetProperty("title").GetString()}|{problem.GetProperty("detail").GetString()}");
            }
        }

        await Assert.That(answers.Distinct().Count()).IsEqualTo(1);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.UserSpaces.AnyAsync(link => link.UserId == seed.Joiner.Id && link.SpaceId == seed.SpaceId)).IsFalse();
    }

    [Test]
    public async Task MembersGetAClearAnswerAndTheInvitationStaysUsable()
    {
        var seed = await SeedAsync();
        var token = await AddInvitationAsync(seed);
        await using var host = await SpaceApiHost.StartAsync(seed.Admin.AuthId);

        var preview = (await (await host.Client.PostAsJsonAsync("/api/invitations/preview", new InvitationTokenRequest(token), Json))
            .Content.ReadFromJsonAsync<InvitationPreviewResponse>(Json))!;
        using var accepted = await host.Client.PostAsJsonAsync("/api/invitations/accept", new InvitationTokenRequest(token), Json);
        using var joiner = host.CreateClient(seed.Joiner.AuthId);
        using var acceptedByInvitee = await joiner.PostAsJsonAsync("/api/invitations/accept", new InvitationTokenRequest(token), Json);

        await Assert.That(preview.SpaceId).IsEqualTo(seed.SpaceId);
        await Assert.That(accepted.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await Assert.That(acceptedByInvitee.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.UserSpaces.CountAsync(link => link.UserId == seed.Admin.Id && link.SpaceId == seed.SpaceId)).IsEqualTo(1);
    }

    [Test]
    public async Task ParallelAcceptsOfOneTokenSucceedOnce()
    {
        var seed = await SeedAsync();
        var token = await AddInvitationAsync(seed);
        var users = new List<User>();
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            for (var index = 0; index < 5; index++)
            {
                users.Add(CreateUser($"racer{index}"));
            }

            dbContext.AddRange(users);
            await dbContext.SaveChangesAsync();
        }

        await using var host = await SpaceApiHost.StartAsync(seed.Admin.AuthId);
        var clients = users.Select(user => host.CreateClient(user.AuthId)).ToList();
        var responses = await Task.WhenAll(clients.Select(client =>
            client.PostAsJsonAsync("/api/invitations/accept", new InvitationTokenRequest(token), Json)));

        var statuses = responses.Select(response => response.StatusCode).ToList();
        foreach (var disposable in responses.Cast<IDisposable>().Concat(clients))
        {
            disposable.Dispose();
        }

        await Assert.That(statuses.Count(status => status == HttpStatusCode.OK)).IsEqualTo(1);
        await Assert.That(statuses.Count(status => status == HttpStatusCode.NotFound)).IsEqualTo(4);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var racerIds = users.Select(user => user.Id).ToList();
        await Assert.That(await verification.UserSpaces.CountAsync(link => racerIds.Contains(link.UserId) && link.SpaceId == seed.SpaceId)).IsEqualTo(1);
    }

    [Test]
    public async Task NewUsersSeeTheInvitationBeforeSigningInAndJoinDuringOnboarding()
    {
        var seed = await SeedAsync();
        var token = await AddInvitationAsync(seed);
        await using var host = await SpaceApiHost.StartAsync(
            "newcomer-auth",
            configureServices: services => services.Replace(ServiceDescriptor.Scoped<IIdentityProvider, FakeIdentityProvider>()));

        // The invitation page is shown before signing in; joining needs a completed onboarding.
        using var anonymous = new HttpClient { BaseAddress = host.Client.BaseAddress };
        using var previewedAnonymously = await anonymous.PostAsJsonAsync("/api/invitations/preview", new InvitationTokenRequest(token), Json);
        var anonymousPreview = (await previewedAnonymously.Content.ReadFromJsonAsync<InvitationPreviewResponse>(Json))!;
        using var acceptedAnonymously = await anonymous.PostAsJsonAsync("/api/invitations/accept", new InvitationTokenRequest(token), Json);
        await Assert.That(previewedAnonymously.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(anonymousPreview.SpaceName).IsEqualTo("Shared space");
        await Assert.That(anonymousPreview.InvitedByName).IsEqualTo("admin");
        await Assert.That(anonymousPreview.SpaceId).IsNull();
        await Assert.That(acceptedAnonymously.StatusCode).IsEqualTo(HttpStatusCode.Unauthorized);

        using var previewed = await host.Client.PostAsJsonAsync("/api/invitations/preview", new InvitationTokenRequest(token), Json);
        using var acceptedEarly = await host.Client.PostAsJsonAsync("/api/invitations/accept", new InvitationTokenRequest(token), Json);
        await Assert.That(previewed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(acceptedEarly.IsSuccessStatusCode).IsFalse();

        using var welcomed = await host.Client.PutAsJsonAsync("/api/users/onboarding",
            new WelcomeUserRequest("Newcomer", "Mine", false, false, AnalyticsConsent.Declined, token), Json);
        await Assert.That(welcomed.StatusCode).IsEqualTo(HttpStatusCode.OK);

        // Repeating the request after a lost response changes nothing.
        using var repeated = await host.Client.PutAsJsonAsync("/api/users/onboarding",
            new WelcomeUserRequest("Newcomer", null, false, false, AnalyticsConsent.Declined, token), Json);
        await Assert.That(repeated.StatusCode).IsEqualTo(HttpStatusCode.OK);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var memberships = await verification.UserSpaces.Include(link => link.Space)
            .Where(link => link.User.AuthId == "newcomer-auth").ToListAsync();
        await Assert.That(memberships.Count).IsEqualTo(2);
        await Assert.That(memberships.Single(link => link.Space.IsPersonal).Space.Name).IsEqualTo("Mine");
        var joined = memberships.Single(link => !link.Space.IsPersonal);
        await Assert.That(joined.SpaceId).IsEqualTo(seed.SpaceId);
        await Assert.That(joined.RoleId).IsEqualTo(SpaceRoles.Member.Id);
        await Assert.That(joined.IsDefault).IsTrue();
        await Assert.That((await verification.SpaceInvitations.SingleAsync()).AcceptedById).IsEqualTo(joined.UserId);
    }

    [Test]
    public async Task OnboardingWithAnUnusableInvitationFailsWithoutCreatingTheAccount()
    {
        var seed = await SeedAsync();
        var revoked = await AddInvitationAsync(seed, revoke: true);
        var valid = await AddInvitationAsync(seed);
        await using var host = await SpaceApiHost.StartAsync(
            "newcomer-auth",
            configureServices: services => services.Replace(ServiceDescriptor.Scoped<IIdentityProvider, FakeIdentityProvider>()));

        using var failed = await host.Client.PutAsJsonAsync("/api/users/onboarding",
            new WelcomeUserRequest("Newcomer", "Ignored", false, false, AnalyticsConsent.Declined, revoked), Json);
        await Assert.That(failed.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            await Assert.That(await dbContext.Users.AnyAsync(user => user.AuthId == "newcomer-auth")).IsFalse();
        }

        using var retried = await host.Client.PutAsJsonAsync("/api/users/onboarding",
            new WelcomeUserRequest("Newcomer", null, false, false, AnalyticsConsent.Declined, valid), Json);
        await Assert.That(retried.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var spaces = await verification.UserSpaces.Where(link => link.User.AuthId == "newcomer-auth").Select(link => link.SpaceId).ToListAsync();
        await Assert.That(spaces.Count).IsEqualTo(2);
        await Assert.That(spaces).Contains(seed.SpaceId);
        await Assert.That(await verification.Spaces.AnyAsync(space => space.Name == "Ignored")).IsFalse();
    }

    [Test]
    public async Task OnboardingWithoutANameKeepsTheDefaultNameOfThePersonalSpace()
    {
        await using var host = await SpaceApiHost.StartAsync(
            "newcomer-auth",
            configureServices: services => services.Replace(ServiceDescriptor.Scoped<IIdentityProvider, FakeIdentityProvider>()));

        using var tooShort = await host.Client.PutAsJsonAsync("/api/users/onboarding",
            new WelcomeUserRequest("Newcomer", " x ", false, false, AnalyticsConsent.Declined), Json);
        using var welcomed = await host.Client.PutAsJsonAsync("/api/users/onboarding",
            new WelcomeUserRequest("Newcomer", null, false, false, AnalyticsConsent.Declined), Json);

        await Assert.That(tooShort.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        await Assert.That(welcomed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var space = await verification.UserSpaces.Where(link => link.User.AuthId == "newcomer-auth").Select(link => link.Space).SingleAsync();
        await Assert.That(space.IsPersonal).IsTrue();
        await Assert.That(space.Name).IsEqualTo(Space.PersonalName);
    }

    [Test]
    public async Task RepeatingACompletedOnboardingLeavesTheProfileSettingAlone()
    {
        var identityProvider = new FakeIdentityProvider();
        await using var host = await SpaceApiHost.StartAsync(
            "newcomer-auth",
            configureServices: services => services.Replace(ServiceDescriptor.Scoped<IIdentityProvider>(_ => identityProvider)));

        using var welcomed = await host.Client.PutAsJsonAsync("/api/users/onboarding",
            new WelcomeUserRequest("Newcomer", null, false, true, AnalyticsConsent.Declined), Json);
        using var repeated = await host.Client.PutAsJsonAsync("/api/users/onboarding",
            new WelcomeUserRequest("Newcomer", null, false, false, AnalyticsConsent.Declined), Json);

        await Assert.That(welcomed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(repeated.StatusCode).IsEqualTo(HttpStatusCode.OK);
        // Only the first, completing request reaches the identity provider.
        await Assert.That(identityProvider.ProfileSettings.Count).IsEqualTo(1);
        await Assert.That(identityProvider.ProfileSettings.Single()).IsTrue();
    }

    [Test]
    public async Task PreviewAndAcceptShareATightRateLimit()
    {
        var seed = await SeedAsync();
        await using var host = await SpaceApiHost.StartAsync(seed.Joiner.AuthId);
        using var other = host.CreateClient(seed.Latecomer.AuthId);

        var statuses = new List<HttpStatusCode>();
        for (var attempt = 0; attempt < 11; attempt++)
        {
            var operation = attempt % 2 == 0 ? "preview" : "accept";
            using var response = await host.Client.PostAsJsonAsync($"/api/invitations/{operation}", new InvitationTokenRequest(InvitationToken.Create().Token), Json);
            statuses.Add(response.StatusCode);
        }

        using var otherIdentity = await other.PostAsJsonAsync("/api/invitations/preview", new InvitationTokenRequest(InvitationToken.Create().Token), Json);

        await Assert.That(statuses.Take(10)).DoesNotContain(HttpStatusCode.TooManyRequests);
        await Assert.That(statuses[10]).IsEqualTo(HttpStatusCode.TooManyRequests);
        await Assert.That(otherIdentity.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task AnonymousPreviewsAreLimitedByAddress()
    {
        await using var host = await SpaceApiHost.StartAsync("unused-auth");
        using var anonymous = new HttpClient { BaseAddress = host.Client.BaseAddress };

        var statuses = new List<HttpStatusCode>();
        for (var attempt = 0; attempt < 11; attempt++)
        {
            using var response = await anonymous.PostAsJsonAsync("/api/invitations/preview", new InvitationTokenRequest(InvitationToken.Create().Token), Json);
            statuses.Add(response.StatusCode);
        }

        // The web application names the visitor's address, so one visitor cannot use up the budget of others.
        using var otherVisitor = new HttpClient { BaseAddress = host.Client.BaseAddress };
        otherVisitor.DefaultRequestHeaders.Add("X-Forwarded-For", "203.0.113.7");
        using var otherAddress = await otherVisitor.PostAsJsonAsync("/api/invitations/preview", new InvitationTokenRequest(InvitationToken.Create().Token), Json);

        await Assert.That(statuses.Take(10).Distinct()).IsEquivalentTo(new[] { HttpStatusCode.NotFound });
        await Assert.That(statuses[10]).IsEqualTo(HttpStatusCode.TooManyRequests);
        await Assert.That(otherAddress.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task TheTokenNeverReachesTheLogs()
    {
        var seed = await SeedAsync();
        var token = await AddInvitationAsync(seed);
        var sink = new CapturingSink();
        await using var host = await SpaceApiHost.StartAsync(
            seed.Joiner.AuthId,
            configureServices: services => services.AddSingleton<ILogEventSink>(sink),
            configuration: new Dictionary<string, string?> { ["Serilog:MinimumLevel:Default"] = "Verbose" });

        using var previewed = await host.Client.PostAsJsonAsync("/api/invitations/preview", new InvitationTokenRequest(token), Json);
        using var accepted = await host.Client.PostAsJsonAsync("/api/invitations/accept", new InvitationTokenRequest(token), Json);
        using var reused = await host.Client.PostAsJsonAsync("/api/invitations/accept", new InvitationTokenRequest(token), Json);

        await Assert.That(accepted.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(sink.Lines).IsNotEmpty();
        await Assert.That(sink.Lines.Where(line => line.Contains(token, StringComparison.Ordinal))).IsEmpty();
    }

    private static async Task<string> AddInvitationAsync(Seed seed, DateTime? createdAt = null, bool revoke = false, User? acceptedBy = null)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await dbContext.Spaces.SingleAsync(item => item.Id == seed.SpaceId);
        var role = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Member.Id);
        var creator = await dbContext.Users.SingleAsync(item => item.Id == seed.Admin.Id);
        var (token, hash) = InvitationToken.Create();
        var invitation = SpaceInvitation.Create(space, role, creator, hash, createdAt ?? DateTime.UtcNow);
        if (revoke)
        {
            invitation.Revoke(DateTime.UtcNow);
        }

        if (acceptedBy is not null)
        {
            var acceptor = await dbContext.Users.SingleAsync(item => item.Id == acceptedBy.Id);
            dbContext.UserSpaces.Add(invitation.AcceptFor(acceptor, DateTime.UtcNow));
        }

        dbContext.SpaceInvitations.Add(invitation);
        await dbContext.SaveChangesAsync();
        return token;
    }

    private static async Task<Seed> SeedAsync()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Shared space");
        var admin = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Admin.Id);
        var adminUser = CreateUser("admin");
        var joiner = CreateUser("joiner");
        var latecomer = CreateUser("latecomer");
        adminUser.UserSpaces.Add(UserSpace.Create(adminUser, space, admin));
        joiner.UserSpaces.Add(UserSpace.Create(joiner, Space.CreatePersonal(), admin));
        dbContext.AddRange(adminUser, joiner, latecomer);
        await dbContext.SaveChangesAsync();
        return new Seed(adminUser, joiner, latecomer, space.Id);
    }

    private static User CreateUser(string name)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        return user;
    }

    private sealed record Seed(User Admin, User Joiner, User Latecomer, Guid SpaceId);

    private sealed class CapturingSink : ILogEventSink
    {
        private readonly ConcurrentQueue<string> _lines = new();

        public IReadOnlyCollection<string> Lines => _lines;

        public void Emit(LogEvent logEvent) =>
            _lines.Enqueue($"{logEvent.RenderMessage()} {string.Join(' ', logEvent.Properties.Select(property => property.Value))} {logEvent.Exception}");
    }

    private sealed class FakeIdentityProvider : IIdentityProvider
    {
        public ConcurrentQueue<bool> ProfileSettings { get; } = new();

        public Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken) =>
            Task.FromResult(new ExternalIdentity("Newcomer", "newcomer@example.test", null, false));

        public Task SetUseProfileInKijkAsync(string authId, bool useProfileInKijk, CancellationToken cancellationToken)
        {
            ProfileSettings.Enqueue(useProfileInKijk);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(string authId, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
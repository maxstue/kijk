using System.Data.Common;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Spaces.CleanupInvitations;
using Kijk.Application.Spaces.CreateInvitation;
using Kijk.Application.Spaces.Shared;
using Kijk.Application.Users.AcceptInvitation;
using Kijk.Application.Users.CompleteOnboarding;
using Kijk.Application.Users.Invitations;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Infrastructure.Spaces;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using Wolverine.Tracking;

namespace Kijk.IntegrationTests.Http;

// Admins invite one person by unique name or e-mail; the invited person accepts or declines in their inbox.
[NotInParallel]
public class SpaceInvitationHttpTests
{
    private const string UnknownEmail = "anna.mueller@gmail.com";
    private static readonly string[] ExpectedEmailLabels = ["ou***@ex***.test", "ou***@ex***.test", "ot***@ex***.test", "an***@gm***.com", "an***@gm***.com"];
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task AnInvitationByNameAppearsInTheInboxAndAcceptingJoinsTheSpace()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);
        using var invitee = host.CreateClient(seed.Outsider.AuthId);

        using var created = await InviteAsync(host.Client, seed.SpaceId, new(SpaceRoles.Viewer.Id, seed.Outsider.UniqueName.ToUpperInvariant(), null));
        await Assert.That(created.StatusCode).IsEqualTo(HttpStatusCode.OK);
        var invitation = (await created.Content.ReadFromJsonAsync<SpaceInvitationResponse>())!;
        await Assert.That(invitation.InviteeLabel).IsEqualTo(seed.Outsider.UniqueName);
        await Assert.That(invitation.RoleId).IsEqualTo(SpaceRoles.Viewer.Id);
        await Assert.That(invitation.ExpiresAt).IsGreaterThan(DateTime.UtcNow.AddDays(6.9)).And.IsLessThan(DateTime.UtcNow.AddDays(7.1));

        var pending = (await host.Client.GetFromJsonAsync<List<SpaceInvitationResponse>>($"/api/spaces/{seed.SpaceId}/invitations"))!;
        await Assert.That(pending.Select(item => item.Id)).IsEquivalentTo(new[] { invitation.Id });

        var inbox = (await invitee.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations"))!;
        await Assert.That(inbox.Count).IsEqualTo(1);
        await Assert.That(inbox[0].Id).IsEqualTo(invitation.Id);
        await Assert.That(inbox[0].SpaceId).IsEqualTo(seed.SpaceId);
        await Assert.That(inbox[0].SpaceName).IsEqualTo("Shared space");
        await Assert.That(inbox[0].RoleName).IsEqualTo(SpaceRoles.ViewerName);
        await Assert.That(inbox[0].InvitedByName).IsEqualTo("actor");

        using var accepted = await invitee.PostAsync($"/api/users/me/invitations/{invitation.Id}/accept", null);
        await Assert.That(accepted.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That((await accepted.Content.ReadFromJsonAsync<AcceptInvitationResponse>())!.SpaceId).IsEqualTo(seed.SpaceId);
        // Accepting again lands in the same space.
        using var acceptedAgain = await invitee.PostAsync($"/api/users/me/invitations/{invitation.Id}/accept", null);
        await Assert.That(acceptedAgain.StatusCode).IsEqualTo(HttpStatusCode.OK);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var membership = await verification.UserSpaces.SingleAsync(link => link.SpaceId == seed.SpaceId && link.UserId == seed.Outsider.Id);
        await Assert.That(membership.RoleId).IsEqualTo(SpaceRoles.Viewer.Id);
        var stored = await verification.SpaceInvitations.SingleAsync();
        await Assert.That(stored.AcceptedById).IsEqualTo(seed.Outsider.Id);
        await Assert.That(await invitee.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations")).IsEmpty();
        await Assert.That(await host.Client.GetFromJsonAsync<List<SpaceInvitationResponse>>($"/api/spaces/{seed.SpaceId}/invitations")).IsEmpty();
    }

    [Test]
    public async Task InvitationsByNameRejectUnknownNamesYourselfMembersAndDuplicates()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var unknown = await InviteAsync(host.Client, seed.SpaceId, new(null, "Nobody#0001", null));
        using var self = await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Actor.UniqueName, null));
        using var member = await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Other.UniqueName, null));
        using var first = await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null));
        using var duplicate = await InviteAsync(host.Client, seed.SpaceId, new(SpaceRoles.Viewer.Id, seed.Outsider.UniqueName, null));

        await Assert.That(unknown.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(self.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        await Assert.That(member.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await Assert.That(first.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(duplicate.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.CountAsync()).IsEqualTo(1);
    }

    [Test]
    [Arguments(null, null)]
    [Arguments("Max#4821", "max@example.test")]
    [Arguments("Max", null)]
    [Arguments(null, "not-an-address")]
    public async Task AnInvitationNamesExactlyOnePerson(string? uniqueName, string? email)
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var response = await InviteAsync(host.Client, seed.SpaceId, new(null, uniqueName, email));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task InvitationsByEmailDoNotRevealWhetherTheAddressHasAnAccount()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var identities = new FakeIdentityInvitations();
        identities.Accounts["outsider@example.test"] = seed.Outsider.AuthId;
        identities.Accounts["other@example.test"] = seed.Other.AuthId;
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId, configureServices: Use(identities));

        using var forAccount = await InviteAsync(host.Client, seed.SpaceId, new(null, null, "Outsider@Example.test"));
        using var forAccountAgain = await InviteAsync(host.Client, seed.SpaceId, new(null, null, "outsider@example.test"));
        using var forMember = await InviteAsync(host.Client, seed.SpaceId, new(null, null, "other@example.test"));
        using var forNobody = await InviteAsync(host.Client, seed.SpaceId, new(null, null, UnknownEmail));
        using var forNobodyAgain = await InviteAsync(host.Client, seed.SpaceId, new(SpaceRoles.Viewer.Id, null, UnknownEmail.ToUpperInvariant()));

        foreach (var response in new[] { forAccount, forAccountAgain, forMember, forNobody, forNobodyAgain })
        {
            await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);
        }

        var responses = new[] { forAccount, forAccountAgain, forMember, forNobody, forNobodyAgain };
        var shapes = new List<string>();
        var invitations = new List<SpaceInvitationResponse>();
        foreach (var response in responses)
        {
            var body = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(body);
            shapes.Add(string.Join(',', document.RootElement.EnumerateObject().Select(property => $"{property.Name}:{property.Value.ValueKind}")));
            invitations.Add(JsonSerializer.Deserialize<SpaceInvitationResponse>(body, Json)!);
        }

        await Assert.That(shapes.Distinct().Count()).IsEqualTo(1);
        await Assert.That(invitations.Select(item => item.InviteeLabel)).IsEquivalentTo(ExpectedEmailLabels);
        await Assert.That(invitations[0]).IsEqualTo(invitations[1]);
        await Assert.That(invitations[3]).IsEqualTo(invitations[4]);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.CountAsync()).IsEqualTo(3);

        // Only the address without an account receives an e-mail from the authentication provider.
        await Assert.That(identities.Invitations.Values.Select(item => item.Email)).IsEquivalentTo(new[] { UnknownEmail });
        // The list shows the shortened addresses only, never the unique name of the account behind one.
        var listed = await host.Client.GetStringAsync($"/api/spaces/{seed.SpaceId}/invitations");
        await Assert.That(listed).DoesNotContain(seed.Outsider.UniqueName).And.DoesNotContain("@example.test");

        using var outsider = host.CreateClient(seed.Outsider.AuthId);
        using var member = host.CreateClient(seed.Other.AuthId);
        await Assert.That((await outsider.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations"))!.Count).IsEqualTo(1);
        // A member does not see an invitation into a space they already belong to.
        await Assert.That(await member.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations")).IsEmpty();
        await Assert.That(await StoredTextAsync()).DoesNotContain("@example.test").And.DoesNotContain(UnknownEmail);
    }

    [Test]
    public async Task CancellingAnEmailRequestDoesNotLoseTheProviderInvitation()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var sending = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var finish = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var identities = new FakeIdentityInvitations
        {
            BeforeSending = token =>
            {
                sending.TrySetResult();
                return finish.Task.WaitAsync(token);
            }
        };
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId, configureServices: Use(identities));
        var request = new CreateSpaceInvitationRequest(null, null, UnknownEmail);
        using var cancellation = new CancellationTokenSource();
        var cancelled = host.Client.PostAsJsonAsync($"/api/spaces/{seed.SpaceId}/invitations", request, cancellation.Token);
        await sending.Task.WaitAsync(TimeSpan.FromSeconds(10));
        var retry = InviteAsync(host.Client, seed.SpaceId, request);
        try
        {
            await cancellation.CancelAsync();
            await Assert.ThrowsAsync<OperationCanceledException>(async () => await cancelled);
        }
        finally
        {
            finish.TrySetResult();
        }

        var response = await ReadAsync(await retry);
        var provider = identities.Invitations.Single();
        await Assert.That(provider.Value.InvitationId).IsEqualTo(response.Id);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var stored = await verification.SpaceInvitations.SingleAsync();
        await Assert.That(stored.ProviderInvitationId).IsEqualTo(provider.Key);
    }

    [Test]
    public async Task AnEmailSubmissionDoesNotExposeOrReplaceAnEarlierNameInvitation()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var identities = new FakeIdentityInvitations();
        const string email = "outsider@example.test";
        identities.Accounts[email] = seed.Outsider.AuthId;
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId, configureServices: Use(identities));
        using var invitee = host.CreateClient(seed.Outsider.AuthId);

        var byName = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null)));
        var byEmail = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(SpaceRoles.Viewer.Id, null, email)));

        await Assert.That(byEmail.Id).IsNotEqualTo(byName.Id);
        await Assert.That(byEmail.InviteeLabel).IsEqualTo("ou***@ex***.test");
        await Assert.That(byEmail.RoleId).IsEqualTo(SpaceRoles.Viewer.Id);
        await Assert.That(identities.Invitations).IsEmpty();
        var inbox = (await invitee.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations"))!;
        await Assert.That(inbox.Select(item => item.Id)).IsEquivalentTo(new[] { byName.Id });
        var listed = (await host.Client.GetFromJsonAsync<List<SpaceInvitationResponse>>($"/api/spaces/{seed.SpaceId}/invitations"))!;
        await Assert.That(listed.Select(item => item.Id)).IsEquivalentTo(new[] { byName.Id, byEmail.Id });
    }

    [Test]
    public async Task RepeatingAnEmailInvitationLinksItAfterTheNameInvitationIsRevoked()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var identities = new FakeIdentityInvitations();
        const string email = "outsider@example.test";
        identities.Accounts[email] = seed.Outsider.AuthId;
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId, configureServices: Use(identities));
        using var invitee = host.CreateClient(seed.Outsider.AuthId);

        var byName = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null)));
        var byEmail = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(SpaceRoles.Viewer.Id, null, email)));
        using var revoked = await host.Client.DeleteAsync($"/api/spaces/{seed.SpaceId}/invitations/{byName.Id}");
        await Assert.That(revoked.StatusCode).IsEqualTo(HttpStatusCode.NoContent);

        var repeated = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, null, email)));

        await Assert.That(repeated).IsEqualTo(byEmail);
        await Assert.That(identities.Invitations).IsEmpty();
        var inbox = (await invitee.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations"))!;
        await Assert.That(inbox.Select(item => item.Id)).IsEquivalentTo(new[] { byEmail.Id });
    }

    [Test]
    public async Task InvitingYourOwnAddressIsRejected()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var identities = new FakeIdentityInvitations();
        identities.Accounts["actor@example.test"] = seed.Actor.AuthId;
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId, configureServices: Use(identities));

        using var response = await InviteAsync(host.Client, seed.SpaceId, new(null, null, "actor@example.test"));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task ANewAccountReceivesEveryMatchingInvitationAndMetadataCleanupRetries()
    {
        const string newcomerAuthId = "newcomer-auth";
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var (secondSpaceId, secondAdmin) = await CreateForeignSpaceAsync();
        await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, newcomerAuthId, DateTime.UtcNow - SpaceInvitation.Lifetime - TimeSpan.FromDays(1));
        var identities = new FakeIdentityInvitations { FailFirstMetadataClear = true };
        await using var host = await SpaceApiHost.StartAsync(
            seed.Actor.AuthId,
            jobsEnabled: true,
            configureServices: services =>
            {
                Use(identities)(services);
                services.Replace(ServiceDescriptor.Singleton<IIdentityProvider>(new NewcomerIdentityProvider(identities)));
            });
        using var otherAdmin = host.CreateClient(secondAdmin);
        var first = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, null, UnknownEmail)));
        var second = await ReadAsync(await InviteAsync(otherAdmin, secondSpaceId, new(null, null, UnknownEmail)));
        var providerId = identities.Invitations.Single(item => item.Value.InvitationId == first.Id).Key;
        identities.SignUp(providerId, newcomerAuthId);
        using var newcomer = host.CreateClient(newcomerAuthId);

        await host.Host.TrackActivity().Timeout(TimeSpan.FromSeconds(30)).ExecuteAndWaitAsync(async Task (_) =>
        {
            using var welcomed = await newcomer.PutAsJsonAsync("/api/users/onboarding", new WelcomeUserRequest("Anna", null, false, false, AnalyticsConsent.Declined), Json);
            await Assert.That(welcomed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        });

        var inbox = (await newcomer.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations"))!;
        await Assert.That(inbox.Select(item => item.Id)).IsEquivalentTo(new[] { first.Id, second.Id });
        await Assert.That(identities.Metadata.ContainsKey(newcomerAuthId)).IsFalse();
        await Assert.That(identities.MetadataClearAttempts).IsEqualTo(2);

        await CleanupAsync(identities);
        await Assert.That(identities.Deleted.Count).IsEqualTo(2);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.AnyAsync(item => item.ProviderInvitationId != null)).IsFalse();
        using var accepted = await newcomer.PostAsync($"/api/users/me/invitations/{first.Id}/accept", null);
        await Assert.That(accepted.StatusCode).IsEqualTo(HttpStatusCode.OK);
    }

    [Test]
    public async Task OnboardingCompletesWhenAConcurrentInvitationAlreadyLinkedTheRecipient()
    {
        const string newcomerAuthId = "newcomer-auth";
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var identities = new FakeIdentityInvitations();
        var race = new CompetingInvitation(() => AddInvitationAsync(seed.SpaceId, seed.Actor.Id, newcomerAuthId));
        await using var host = await SpaceApiHost.StartAsync(
            seed.Actor.AuthId,
            jobsEnabled: true,
            configureServices: services =>
            {
                Use(identities)(services);
                services.Replace(ServiceDescriptor.Singleton<IIdentityProvider>(new NewcomerIdentityProvider(identities)));
                services.ConfigureDbContext<AppDbContext>(options => options.AddInterceptors(race));
            });

        var original = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, null, UnknownEmail)));
        identities.SignUp(identities.Invitations.Single().Key, newcomerAuthId);
        using var newcomer = host.CreateClient(newcomerAuthId);
        await host.Host.TrackActivity().Timeout(TimeSpan.FromSeconds(30)).ExecuteAndWaitAsync(async Task (_) =>
        {
            using var welcomed = await newcomer.PutAsJsonAsync("/api/users/onboarding", new WelcomeUserRequest("Anna", null, false, false, AnalyticsConsent.Declined), Json);
            await Assert.That(welcomed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        });

        var inbox = (await newcomer.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations"))!;
        await Assert.That(inbox.Select(item => item.Id)).IsEquivalentTo(new[] { race.InvitationId });
        await Assert.That(identities.Metadata.ContainsKey(newcomerAuthId)).IsFalse();
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.Where(item => item.Id == original.Id).Select(item => item.InviteeAuthId).SingleAsync()).IsNull();
    }

    [Test]
    public async Task DecliningRevokingAndExpiryCloseTheInvitationAndDeleteTheProviderInvitation()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var identities = new FakeIdentityInvitations();
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId, configureServices: Use(identities));
        using var invitee = host.CreateClient(seed.Outsider.AuthId);

        var declined = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null)));
        var revoked = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, null, "revoked@example.test")));
        var expired = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, null, "expired@example.test")));
        var pending = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, null, "pending@example.test")));
        await ExecuteAsync($"UPDATE space_invitations SET expires_at = now() - interval '1 minute' WHERE id = '{expired.Id}'");

        using var declinedResponse = await invitee.PostAsync($"/api/users/me/invitations/{declined.Id}/decline", null);
        using var declinedAgain = await invitee.PostAsync($"/api/users/me/invitations/{declined.Id}/decline", null);
        using var acceptedAfterDecline = await invitee.PostAsync($"/api/users/me/invitations/{declined.Id}/accept", null);
        using var revokedResponse = await host.Client.DeleteAsync($"/api/spaces/{seed.SpaceId}/invitations/{revoked.Id}");

        await Assert.That(declinedResponse.StatusCode).IsEqualTo(HttpStatusCode.NoContent);
        await Assert.That(declinedAgain.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(acceptedAfterDecline.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(revokedResponse.StatusCode).IsEqualTo(HttpStatusCode.NoContent);
        await Assert.That(await invitee.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations")).IsEmpty();
        var listed = (await host.Client.GetFromJsonAsync<List<SpaceInvitationResponse>>($"/api/spaces/{seed.SpaceId}/invitations"))!;
        await Assert.That(listed.Select(item => item.Id)).IsEquivalentTo(new[] { pending.Id });

        var pendingProviderId = identities.Invitations.Single(item => item.Value.Email == "pending@example.test").Key;
        await CleanupAsync(identities);

        // Only the pending invitation still needs its e-mail at the provider.
        await Assert.That(identities.Invitations.Keys).IsEquivalentTo(new[] { pendingProviderId });
        await Assert.That(identities.Deleted.Count).IsEqualTo(2);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var withProvider = await verification.SpaceInvitations.Where(item => item.ProviderInvitationId != null).Select(item => item.Id).ToListAsync();
        await Assert.That(withProvider).IsEquivalentTo(new[] { pending.Id });
    }

    [Test]
    public async Task ParallelAcceptancesCreateExactlyOneMembership()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);
        var invitation = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null)));
        using var invitee = host.CreateClient(seed.Outsider.AuthId);

        var responses = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => invitee.PostAsync($"/api/users/me/invitations/{invitation.Id}/accept", null)));

        await Assert.That(responses.All(response => response.StatusCode == HttpStatusCode.OK)).IsTrue();
        foreach (var response in responses)
        {
            response.Dispose();
        }

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.UserSpaces.CountAsync(link => link.SpaceId == seed.SpaceId && link.UserId == seed.Outsider.Id)).IsEqualTo(1);
    }

    [Test]
    public async Task AcceptAndRevokeCannotBothCloseAnInvitation()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);
        var invitation = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null)));
        using var invitee = host.CreateClient(seed.Outsider.AuthId);

        var accept = invitee.PostAsync($"/api/users/me/invitations/{invitation.Id}/accept", null);
        var revoke = host.Client.DeleteAsync($"/api/spaces/{seed.SpaceId}/invitations/{invitation.Id}");
        await Task.WhenAll(accept, revoke);
        using var acceptance = await accept;
        using var revocation = await revoke;

        await Assert.That(acceptance.IsSuccessStatusCode).IsNotEqualTo(revocation.IsSuccessStatusCode);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var stored = await verification.SpaceInvitations.SingleAsync();
        await Assert.That(stored.AcceptedAt is not null).IsEqualTo(acceptance.IsSuccessStatusCode);
        await Assert.That(stored.RevokedAt is not null).IsEqualTo(revocation.IsSuccessStatusCode);
    }

    [Test]
    public async Task InvitationsOfOtherPeopleCannotBeSeenAcceptedOrDeclined()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);
        var invitation = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null)));
        var (_, strangerAuthId) = await CreateForeignSpaceAsync();
        using var stranger = host.CreateClient(strangerAuthId);

        using var accepted = await stranger.PostAsync($"/api/users/me/invitations/{invitation.Id}/accept", null);
        using var declined = await stranger.PostAsync($"/api/users/me/invitations/{invitation.Id}/decline", null);

        await Assert.That(await stranger.GetFromJsonAsync<List<ReceivedInvitationResponse>>("/api/users/me/invitations")).IsEmpty();
        await Assert.That(accepted.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(declined.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var stored = await verification.SpaceInvitations.SingleAsync();
        await Assert.That(stored.AcceptedAt).IsNull();
        await Assert.That(stored.DeclinedAt).IsNull();
    }

    [Test]
    public async Task InvitationsCannotGrantTheAdminRole()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var response = await InviteAsync(host.Client, seed.SpaceId, new(SpaceRoles.Admin.Id, seed.Outsider.UniqueName, null));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.AnyAsync()).IsFalse();
    }

    [Test]
    [Arguments(SpaceRoles.MemberName)]
    [Arguments(SpaceRoles.ViewerName)]
    public async Task OnlyAdminsManageInvitations(string role)
    {
        var seed = await SeedAsync(role);
        var existing = await AddInvitationAsync(seed.SpaceId, seed.Other.Id, seed.Outsider.AuthId);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var created = await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null));
        using var listed = await host.Client.GetAsync($"/api/spaces/{seed.SpaceId}/invitations");
        using var revoked = await host.Client.DeleteAsync($"/api/spaces/{seed.SpaceId}/invitations/{existing}");

        await Assert.That(created.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
        await Assert.That(listed.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
        await Assert.That(revoked.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var invitations = await verification.SpaceInvitations.ToListAsync();
        await Assert.That(invitations.Count).IsEqualTo(1);
        await Assert.That(invitations[0].RevokedAt).IsNull();
    }

    [Test]
    public async Task PersonalSpacesRejectInvitations()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        Guid personalSpaceId;
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var user = await dbContext.Users.SingleAsync(item => item.Id == seed.Actor.Id);
            var admin = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Admin.Id);
            var personal = Space.CreatePersonal();
            dbContext.UserSpaces.Add(UserSpace.Create(user, personal, admin));
            await dbContext.SaveChangesAsync();
            personalSpaceId = personal.Id;
        }

        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);
        using var response = await InviteAsync(host.Client, personalSpaceId, new(null, seed.Outsider.UniqueName, null));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.AnyAsync()).IsFalse();
    }

    [Test]
    public async Task InvitationsOfOtherSpacesStayHidden()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var (foreignSpaceId, _) = await CreateForeignSpaceAsync();
        Guid foreignInvitation;
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var foreignAdminId = await dbContext.UserSpaces.Where(link => link.SpaceId == foreignSpaceId).Select(link => link.UserId).SingleAsync();
            foreignInvitation = await AddInvitationAsync(foreignSpaceId, foreignAdminId, seed.Outsider.AuthId);
        }

        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var created = await InviteAsync(host.Client, foreignSpaceId, new(null, seed.Outsider.UniqueName, null));
        using var listed = await host.Client.GetAsync($"/api/spaces/{foreignSpaceId}/invitations");
        // An invitation of another space cannot be revoked through a space the user administers.
        using var revokedThroughOwn = await host.Client.DeleteAsync($"/api/spaces/{seed.SpaceId}/invitations/{foreignInvitation}");
        var ownList = (await host.Client.GetFromJsonAsync<List<SpaceInvitationResponse>>($"/api/spaces/{seed.SpaceId}/invitations"))!;

        await Assert.That(created.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(listed.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(revokedThroughOwn.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(ownList).IsEmpty();
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That((await verification.SpaceInvitations.SingleAsync()).RevokedAt).IsNull();
    }

    [Test]
    public async Task AnExpiredInvitationCanBeRenewedForTheSamePerson()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var expired = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, seed.Outsider.AuthId, DateTime.UtcNow - SpaceInvitation.Lifetime - TimeSpan.FromDays(1));
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var renewed = await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null));

        await Assert.That(renewed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That((await verification.SpaceInvitations.SingleAsync(item => item.Id == expired)).RevokedAt).IsNotNull();
    }

    [Test]
    public async Task ExpiredInvitationsAreNotListedAndClosedOnesAreDeletedAfterTheRetention()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var now = DateTime.UtcNow;
        var pending = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, "pending-auth");
        var recentlyExpired = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, "recent-auth", now - SpaceInvitation.Lifetime - TimeSpan.FromDays(1));
        var longExpired = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, "expired-auth", now - SpaceInvitation.Lifetime - SpaceInvitation.Retention - TimeSpan.FromDays(1));
        var longRevoked = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, "revoked-auth", now - TimeSpan.FromDays(6), revokedAt: now - SpaceInvitation.Retention - TimeSpan.FromDays(1));

        await Assert.That(await CleanupAsync(new FakeIdentityInvitations())).IsEqualTo(2);

        await using (var verification = PostgreSqlTestDatabase.CreateDbContext())
        {
            var kept = await verification.SpaceInvitations.Select(item => item.Id).ToListAsync();
            await Assert.That(kept).IsEquivalentTo(new[] { pending, recentlyExpired });
            await Assert.That(kept).DoesNotContain(longExpired).And.DoesNotContain(longRevoked);
        }

        // The expired invitation is kept for the retention but no longer listed.
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);
        var listed = (await host.Client.GetFromJsonAsync<List<SpaceInvitationResponse>>($"/api/spaces/{seed.SpaceId}/invitations"))!;
        await Assert.That(listed.Select(item => item.Id)).IsEquivalentTo(new[] { pending });
    }

    [Test]
    public async Task ThePublishedCleanupMessageDeletesClosedInvitationsThroughTheDurableQueue()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var now = DateTime.UtcNow;
        var pending = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, "pending-auth");
        await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, "revoked-auth", now - TimeSpan.FromDays(6), revokedAt: now - SpaceInvitation.Retention - TimeSpan.FromDays(1));
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId, jobsEnabled: true);

        await host.Host.TrackActivity().Timeout(TimeSpan.FromSeconds(30))
            .ExecuteAndWaitAsync(context => context.PublishAsync(new CleanupInvitations()));

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var kept = await verification.SpaceInvitations.Select(item => item.Id).ToListAsync();
        await Assert.That(kept).IsEquivalentTo(new[] { pending });
    }

    [Test]
    public async Task AProviderDeletionFailureDoesNotBlockOtherInvitations()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var identities = new FakeIdentityInvitations();
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId, configureServices: Use(identities));
        var first = await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, null, UnknownEmail)));
        await ReadAsync(await InviteAsync(host.Client, seed.SpaceId, new(null, null, "another@example.test")));
        identities.FailingDeletion = identities.Invitations.Single(item => item.Value.InvitationId == first.Id).Key;
        await using (var db = PostgreSqlTestDatabase.CreateDbContext())
        {
            await db.SpaceInvitations.ExecuteUpdateAsync(setters => setters.SetProperty(item => item.ExpiresAt, DateTime.UtcNow.AddMinutes(-1)));
        }

        await CleanupAsync(identities);

        await Assert.That(identities.Invitations.Values.Select(item => item.InvitationId)).IsEquivalentTo(new[] { first.Id });
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.Where(item => item.ProviderInvitationId != null).Select(item => item.Id).ToListAsync())
            .IsEquivalentTo(new[] { first.Id });
    }

    [Test]
    public async Task DeletingASpaceDeletesItsInvitationsAndTheirProviderInvitations()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var identities = new FakeIdentityInvitations();
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId, jobsEnabled: true, configureServices: Use(identities));
        await InviteAsync(host.Client, seed.SpaceId, new(null, null, UnknownEmail));
        await InviteAsync(host.Client, seed.SpaceId, new(null, seed.Outsider.UniqueName, null));

        await host.Host.TrackActivity().Timeout(TimeSpan.FromSeconds(30)).ExecuteAndWaitAsync(async Task (_) =>
        {
            using var deleted = await host.Client.DeleteAsync($"/api/spaces/{seed.SpaceId}");
            await Assert.That(deleted.StatusCode).IsEqualTo(HttpStatusCode.NoContent);
        });
        await Assert.That(identities.Invitations).IsEmpty();
        await Assert.That(identities.Deleted.Count).IsEqualTo(1);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.AnyAsync()).IsFalse();
    }

    private static Action<IServiceCollection> Use(FakeIdentityInvitations identities) =>
        services => services.Replace(ServiceDescriptor.Singleton<IIdentityInvitations>(identities));

    private static Task<HttpResponseMessage> InviteAsync(HttpClient client, Guid spaceId, CreateSpaceInvitationRequest request) =>
        client.PostAsJsonAsync($"/api/spaces/{spaceId}/invitations", request);

    private static async Task<SpaceInvitationResponse> ReadAsync(HttpResponseMessage response)
    {
        using (response)
        {
            await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);
            return (await response.Content.ReadFromJsonAsync<SpaceInvitationResponse>())!;
        }
    }

    private static async Task<int> CleanupAsync(FakeIdentityInvitations identities)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var handler = new CleanupInvitationsHandler(
            dbContext,
            new ProviderInvitationEraser(dbContext, identities, NullLogger<ProviderInvitationEraser>.Instance),
            TimeProvider.System,
            NullLogger<CleanupInvitationsHandler>.Instance);
        return await handler.CleanupAsync(CancellationToken.None);
    }

    private static async Task ExecuteAsync(string sql)
    {
        await using var connection = new NpgsqlConnection(PostgreSqlTestDatabase.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

    // Every invitation column as text, to prove that no e-mail address is stored.
    private static async Task<string> StoredTextAsync()
    {
        await using var connection = new NpgsqlConnection(PostgreSqlTestDatabase.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("SELECT coalesce(string_agg(row_to_json(i)::text, ' '), '') FROM space_invitations i", connection);
        return (string)(await command.ExecuteScalarAsync())!;
    }

    private static async Task<Guid> AddInvitationAsync(Guid spaceId, Guid createdById, string inviteeAuthId, DateTime? createdAt = null, DateTime? revokedAt = null)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await dbContext.Spaces.SingleAsync(item => item.Id == spaceId);
        var role = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Member.Id);
        var creator = await dbContext.Users.SingleAsync(item => item.Id == createdById);
        var invitation = SpaceInvitation.ForIdentity(space, role, creator, inviteeAuthId, "Invitee#0001", createdAt ?? DateTime.UtcNow);
        if (revokedAt is { } revoked)
        {
            invitation.Revoke(revoked);
        }

        dbContext.SpaceInvitations.Add(invitation);
        await dbContext.SaveChangesAsync();
        return invitation.Id;
    }

    private static async Task<Seed> SeedAsync(string roleName)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Shared space");
        var role = await dbContext.Roles.SingleAsync(item => item.Name == roleName);
        var admin = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Admin.Id);
        var actor = CreateUser("actor", 1);
        var other = CreateUser("other", 2);
        var outsider = CreateUser("outsider", 3);
        actor.UserSpaces.Add(UserSpace.Create(actor, space, role));
        other.UserSpaces.Add(UserSpace.Create(other, space, admin));
        outsider.UserSpaces.Add(UserSpace.Create(outsider, Space.CreatePersonal(), admin));
        dbContext.AddRange(actor, other, outsider);
        await dbContext.SaveChangesAsync();
        return new Seed(actor, other, outsider, space.Id);
    }

    private static async Task<(Guid SpaceId, string AuthId)> CreateForeignSpaceAsync()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Foreign space");
        var admin = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Admin.Id);
        var stranger = CreateUser("stranger", 4);
        stranger.UserSpaces.Add(UserSpace.Create(stranger, space, admin));
        dbContext.Add(stranger);
        await dbContext.SaveChangesAsync();
        return (space.Id, stranger.AuthId);
    }

    private static User CreateUser(string name, int tag)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.AssignTag(tag);
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        return user;
    }

    private sealed record Seed(User Actor, User Other, User Outsider, Guid SpaceId);

    // Adds a competing row after the check and before PostgreSQL executes the recipient update.
    private sealed class CompetingInvitation(Func<Task<Guid>> insert) : DbCommandInterceptor
    {
        public Guid InvitationId { get; private set; }

        public override async ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
            DbCommand command, CommandEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (eventData.CommandSource == CommandSource.ExecuteUpdate && InvitationId == Guid.Empty
                && command.CommandText.Contains("SET invitee_auth_id", StringComparison.Ordinal))
            {
                InvitationId = await insert();
            }

            return result;
        }
    }

    private sealed class NewcomerIdentityProvider(FakeIdentityInvitations invitations) : IIdentityProvider
    {
        public Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken) =>
            Task.FromResult(new ExternalIdentity(null, null, null, false)
            {
                InvitationId = invitations.Metadata.TryGetValue(authId, out var id) ? id : null,
                VerifiedEmails = invitations.Accounts.Where(item => item.Value == authId).Select(item => item.Key).ToArray()
            });

        public Task SetUseProfileInKijkAsync(string authId, bool useProfileInKijk, CancellationToken cancellationToken) => Task.CompletedTask;

        public Task DeleteAsync(string authId, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
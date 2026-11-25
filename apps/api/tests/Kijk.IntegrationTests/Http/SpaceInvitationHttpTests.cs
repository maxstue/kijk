using System.Buffers.Text;
using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using Kijk.Application.Spaces.CleanupInvitations;
using Kijk.Application.Spaces.CreateInvitation;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Kijk.IntegrationTests.Http;

// Admins create single-use invitation links and manage the pending ones; only the token hash is stored.
[NotInParallel]
public class SpaceInvitationHttpTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task AdminsCreateListAndRevokeInvitationsAndOnlyTheHashIsStored()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var created = await host.Client.PostAsJsonAsync($"/api/spaces/{seed.SpaceId}/invitations", new CreateSpaceInvitationRequest(null));
        await Assert.That(created.StatusCode).IsEqualTo(HttpStatusCode.OK);
        var invitation = (await created.Content.ReadFromJsonAsync<CreateSpaceInvitationResponse>())!;
        using var viewerCreated = await host.Client.PostAsJsonAsync($"/api/spaces/{seed.SpaceId}/invitations", new CreateSpaceInvitationRequest(SpaceRoles.Viewer.Id));
        var viewerInvitation = (await viewerCreated.Content.ReadFromJsonAsync<CreateSpaceInvitationResponse>())!;

        await Assert.That(invitation.RoleId).IsEqualTo(SpaceRoles.Member.Id);
        await Assert.That(viewerInvitation.RoleId).IsEqualTo(SpaceRoles.Viewer.Id);
        await Assert.That(invitation.Link).IsEqualTo($"/invite#{invitation.Token}");
        await Assert.That(Base64Url.DecodeFromChars(invitation.Token).Length).IsEqualTo(32);
        await Assert.That(invitation.ExpiresAt).IsGreaterThan(DateTime.UtcNow.AddDays(6.9)).And.IsLessThan(DateTime.UtcNow.AddDays(7.1));

        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var stored = await dbContext.SpaceInvitations.SingleAsync(item => item.Id == invitation.Id);
            await Assert.That(stored.TokenHash).IsEquivalentTo(SHA256.HashData(Base64Url.DecodeFromChars(invitation.Token)));
            await Assert.That(stored.CreatedById).IsEqualTo(seed.Actor.Id);
        }

        using var listed = await host.Client.GetAsync($"/api/spaces/{seed.SpaceId}/invitations");
        var body = await listed.Content.ReadAsStringAsync();
        var pending = (await listed.Content.ReadFromJsonAsync<List<SpaceInvitationResponse>>())!;
        await Assert.That(listed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(body).DoesNotContain(invitation.Token);
        await Assert.That(pending.Select(item => item.Id)).IsEquivalentTo(new[] { viewerInvitation.Id, invitation.Id });
        await Assert.That(pending.Single(item => item.Id == invitation.Id).RoleName).IsEqualTo(SpaceRoles.MemberName);
        await Assert.That(pending.Single(item => item.Id == invitation.Id).CreatedByName).IsEqualTo("actor");

        using var revoked = await host.Client.DeleteAsync($"/api/spaces/{seed.SpaceId}/invitations/{invitation.Id}");
        using var revokedAgain = await host.Client.DeleteAsync($"/api/spaces/{seed.SpaceId}/invitations/{invitation.Id}");
        var remaining = (await host.Client.GetFromJsonAsync<List<SpaceInvitationResponse>>($"/api/spaces/{seed.SpaceId}/invitations"))!;

        await Assert.That(revoked.StatusCode).IsEqualTo(HttpStatusCode.NoContent);
        await Assert.That(revokedAgain.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(remaining.Select(item => item.Id)).IsEquivalentTo(new[] { viewerInvitation.Id });
    }

    [Test]
    public async Task InvitationsCannotGrantTheAdminRole()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var response = await host.Client.PostAsJsonAsync($"/api/spaces/{seed.SpaceId}/invitations", new CreateSpaceInvitationRequest(SpaceRoles.Admin.Id));

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
        var existing = await AddInvitationAsync(seed.SpaceId, seed.Other.Id);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var created = await host.Client.PostAsJsonAsync($"/api/spaces/{seed.SpaceId}/invitations", new CreateSpaceInvitationRequest(null));
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
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var user = await dbContext.Users.SingleAsync(item => item.Id == seed.Actor.Id);
            var admin = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Admin.Id);
            var personal = Space.CreatePersonal();
            dbContext.UserSpaces.Add(UserSpace.Create(user, personal, admin));
            await dbContext.SaveChangesAsync();
            seed = seed with { PersonalSpaceId = personal.Id };
        }

        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);
        using var response = await host.Client.PostAsJsonAsync($"/api/spaces/{seed.PersonalSpaceId}/invitations", new CreateSpaceInvitationRequest(null));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.AnyAsync()).IsFalse();
    }

    [Test]
    public async Task InvitationsOfOtherSpacesStayHidden()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var (foreignSpaceId, foreignAdminId) = await CreateForeignSpaceAsync();
        var foreignInvitation = await AddInvitationAsync(foreignSpaceId, foreignAdminId);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var created = await host.Client.PostAsJsonAsync($"/api/spaces/{foreignSpaceId}/invitations", new CreateSpaceInvitationRequest(null));
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
    public async Task ExpiredInvitationsAreNotListedAndClosedOnesAreDeletedAfterTheRetention()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        var now = DateTime.UtcNow;
        var pending = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id);
        var recentlyExpired = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, now - SpaceInvitation.Lifetime - TimeSpan.FromDays(1));
        var longExpired = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, now - SpaceInvitation.Lifetime - SpaceInvitation.Retention - TimeSpan.FromDays(1));
        var longRevoked = await AddInvitationAsync(seed.SpaceId, seed.Actor.Id, now - TimeSpan.FromDays(6), revokedAt: now - SpaceInvitation.Retention - TimeSpan.FromDays(1));

        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            var handler = new CleanupInvitationsHandler(dbContext, TimeProvider.System, NullLogger<CleanupInvitationsHandler>.Instance);
            await Assert.That(await handler.CleanupAsync(CancellationToken.None)).IsEqualTo(2);
        }

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
    public async Task DeletingASpaceDeletesItsInvitations()
    {
        var seed = await SeedAsync(SpaceRoles.AdminName);
        await AddInvitationAsync(seed.SpaceId, seed.Actor.Id);
        await using var host = await SpaceApiHost.StartAsync(seed.Actor.AuthId);

        using var deleted = await host.Client.DeleteAsync($"/api/spaces/{seed.SpaceId}");

        await Assert.That(deleted.StatusCode).IsEqualTo(HttpStatusCode.NoContent);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.SpaceInvitations.AnyAsync()).IsFalse();
    }

    private static async Task<Guid> AddInvitationAsync(Guid spaceId, Guid createdById, DateTime? createdAt = null, DateTime? revokedAt = null)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = await dbContext.Spaces.SingleAsync(item => item.Id == spaceId);
        var role = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Member.Id);
        var creator = await dbContext.Users.SingleAsync(item => item.Id == createdById);
        var invitation = SpaceInvitation.Create(space, role, creator, InvitationToken.Create().Hash, createdAt ?? DateTime.UtcNow);
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
        var actor = CreateUser("actor");
        var other = CreateUser("other");
        actor.UserSpaces.Add(UserSpace.Create(actor, space, role));
        other.UserSpaces.Add(UserSpace.Create(other, space, admin));
        dbContext.AddRange(actor, other);
        await dbContext.SaveChangesAsync();
        return new Seed(actor, other, space.Id, Guid.Empty);
    }

    private static async Task<(Guid SpaceId, Guid AdminId)> CreateForeignSpaceAsync()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Foreign space");
        var admin = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Admin.Id);
        var stranger = CreateUser("stranger");
        stranger.UserSpaces.Add(UserSpace.Create(stranger, space, admin));
        dbContext.Add(stranger);
        await dbContext.SaveChangesAsync();
        return (space.Id, stranger.Id);
    }

    private static User CreateUser(string name)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        return user;
    }

    private sealed record Seed(User Actor, User Other, Guid SpaceId, Guid PersonalSpaceId);
}
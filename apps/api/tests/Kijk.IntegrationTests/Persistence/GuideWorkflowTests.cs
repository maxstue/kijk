using Kijk.Application.Users.Guide;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;

namespace Kijk.IntegrationTests.Persistence;

[NotInParallel]
public class GuideWorkflowTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task ProgressPersistsAcrossSessionsAndPreferencesDoNotResetCompletion()
    {
        Guid userId;
        await using (var db = PostgreSqlTestDatabase.CreateDbContext())
        {
            var user = User.Init("guide-user", "Guide user", null);
            user.CompleteOnboarding("Guide user", AnalyticsConsent.Declined, DateTime.UtcNow);
            db.Users.Add(user);
            await db.SaveChangesAsync();
            userId = user.Id;
            var current = new CurrentUser { User = new SimpleAuthUser(userId, user.AuthId, Guid.Empty, user.Name, null, true) };
            var result = await new GuideHandler(db, current).UpdateAsync(new(true, true), CancellationToken.None);
            await Assert.That(result.IsSuccess).IsTrue();
        }

        await using var reloaded = PostgreSqlTestDatabase.CreateDbContext();
        var account = new CurrentUser { User = new SimpleAuthUser(userId, "guide-user", Guid.Empty, "Guide user", null, true) };
        var handler = new GuideHandler(reloaded, account);
        var saved = await handler.ReadAsync(CancellationToken.None);
        await Assert.That(saved.Value.GuideHidden).IsTrue();
        await Assert.That(saved.Value.GuideDashboardVersion).IsEqualTo(GuideHandler.Version);
        await Assert.That(saved.Value.GuideFirstConsumptionAt).IsNull();

        var restored = await handler.UpdateAsync(new(false, false), CancellationToken.None);
        await Assert.That(restored.Value.GuideHidden).IsFalse();
        await Assert.That(restored.Value.GuideDashboardVersion).IsEqualTo(GuideHandler.Version);
        var entity = await reloaded.Users.SingleAsync(user => user.Id == userId);
        await Assert.That(entity.OnboardingCompleted).IsTrue();
        await Assert.That(entity.AnalyticsConsent).IsEqualTo(AnalyticsConsent.Declined);
    }

    [Test]
    public async Task GuideUpdatesOnlyTheAuthenticatedUser()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var first = User.Init("first", "First", null);
        var second = User.Init("second", "Second", null);
        db.Users.AddRange(first, second);
        await db.SaveChangesAsync();
        var current = new CurrentUser { User = new SimpleAuthUser(first.Id, first.AuthId, Guid.Empty, first.Name, null, true) };
        await new GuideHandler(db, current).UpdateAsync(new(true, true), CancellationToken.None);
        db.ChangeTracker.Clear();
        var other = await db.Users.SingleAsync(user => user.Id == second.Id);
        await Assert.That(other.GuideHidden).IsFalse();
        await Assert.That(other.GuideDashboardVersion).IsEqualTo(0);
        await Assert.That(other.GuideFirstConsumptionAt).IsNull();
    }
}
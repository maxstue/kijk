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
            var result = await new GuideHandler(db, current).UpdateAsync(new(true, "dashboard"), CancellationToken.None);
            await Assert.That(result.IsSuccess).IsTrue();
        }

        await using var reloaded = PostgreSqlTestDatabase.CreateDbContext();
        var account = new CurrentUser { User = new SimpleAuthUser(userId, "guide-user", Guid.Empty, "Guide user", null, true) };
        var handler = new GuideHandler(reloaded, account);
        var saved = await handler.ReadAsync(CancellationToken.None);
        await Assert.That(saved.Value.GuideVersion).IsEqualTo(GuideHandler.Version);
        await Assert.That(saved.Value.GuideHidden).IsTrue();
        await Assert.That(saved.Value.GuideCompletedVersion).IsEqualTo(GuideHandler.Version);
        await Assert.That(saved.Value.GuideCompletedSteps).IsEquivalentTo(["dashboard"]);
        await Assert.That(saved.Value.GuideFirstConsumptionAt).IsNull();

        var restored = await handler.UpdateAsync(new(false, null), CancellationToken.None);
        await Assert.That(restored.Value.GuideHidden).IsFalse();
        await Assert.That(restored.Value.GuideCompletedVersion).IsEqualTo(GuideHandler.Version);
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
        await new GuideHandler(db, current).UpdateAsync(new(true, "dashboard"), CancellationToken.None);
        db.ChangeTracker.Clear();
        var other = await db.Users.SingleAsync(user => user.Id == second.Id);
        await Assert.That(other.GuideHidden).IsFalse();
        await Assert.That(other.GuideCompletedVersion).IsEqualTo(0);
        await Assert.That(other.GuideCompletedSteps).IsEmpty();
        await Assert.That(other.GuideFirstConsumptionAt).IsNull();
    }
    [Test]
    public async Task SubtourCompletionsAccumulateIdempotentlyAndRejectUnknownSteps()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var user = User.Init("steps", "Guide steps", null);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var current = new CurrentUser { User = new SimpleAuthUser(user.Id, user.AuthId, Guid.Empty, user.Name, null, true) };
        var handler = new GuideHandler(db, current);
        await handler.UpdateAsync(new(null, "dashboard"), CancellationToken.None);
        await handler.UpdateAsync(new(null, "finances"), CancellationToken.None);
        await handler.UpdateAsync(new(null, "dashboard"), CancellationToken.None);
        var invalid = await handler.UpdateAsync(new(null, "unknown"), CancellationToken.None);
        await Assert.That(invalid.IsSuccess).IsFalse();
        db.ChangeTracker.Clear();
        var saved = await handler.ReadAsync(CancellationToken.None);
        await Assert.That(saved.Value.GuideCompletedSteps).IsEquivalentTo(["dashboard", "finances"]);
        await Assert.That(saved.Value.GuideCompletedVersion).IsEqualTo(GuideHandler.Version);
        await Assert.That(saved.Value.GuideFirstConsumptionAt).IsNull();
    }

    [Test]
    public async Task NewGuideVersionResetsOnlySubtourProgress()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var user = User.Init("version", "Guide version", null);
        user.CompleteGuideStep(1, "dashboard");
        user.CompleteGuideStep(1, "finances");
        user.CompleteGuideStep(2, "resources");
        user.CompleteGuideStep(1, "limits");
        db.Users.Add(user);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        var saved = await db.Users.SingleAsync(account => account.Id == user.Id);
        await Assert.That(saved.GuideCompletedVersion).IsEqualTo(2);
        await Assert.That(saved.GuideCompletedSteps).IsEquivalentTo(["resources"]);
    }
}
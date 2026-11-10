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
    public async Task ProgressPersistsAcrossSessionsWithoutChangingOnboarding()
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
            var result = await new GuideHandler(db, current, TimeProvider.System).UpdateAsync(new("dashboard"), CancellationToken.None);
            await Assert.That(result.IsSuccess).IsTrue();
        }

        await using var reloaded = PostgreSqlTestDatabase.CreateDbContext();
        var account = new CurrentUser { User = new SimpleAuthUser(userId, "guide-user", Guid.Empty, "Guide user", null, true) };
        var handler = new GuideHandler(reloaded, account, TimeProvider.System);
        var saved = await handler.ReadAsync(CancellationToken.None);
        await Assert.That(saved.Value.GuideVersion).IsEqualTo(GuideHandler.Version);
        await Assert.That(saved.Value.GuideCompletedVersion).IsEqualTo(GuideHandler.Version);
        await Assert.That(saved.Value.GuideCompletedSteps).IsEquivalentTo(["dashboard"]);
        await Assert.That(saved.Value.GuideCompletedAt).IsNull();

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
        await new GuideHandler(db, current, TimeProvider.System).UpdateAsync(new("dashboard"), CancellationToken.None);
        db.ChangeTracker.Clear();
        var other = await db.Users.SingleAsync(user => user.Id == second.Id);
        await Assert.That(other.GuideCompletedVersion).IsEqualTo(0);
        await Assert.That(other.GuideCompletedSteps).IsEmpty();
        await Assert.That(other.GuideCompletedAt).IsNull();
    }
    [Test]
    public async Task SubtourCompletionsAccumulateIdempotentlyAndRejectUnknownSteps()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var user = User.Init("steps", "Guide steps", null);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var current = new CurrentUser { User = new SimpleAuthUser(user.Id, user.AuthId, Guid.Empty, user.Name, null, true) };
        var handler = new GuideHandler(db, current, TimeProvider.System);
        await handler.UpdateAsync(new("dashboard"), CancellationToken.None);
        await handler.UpdateAsync(new("finances"), CancellationToken.None);
        await handler.UpdateAsync(new("dashboard"), CancellationToken.None);
        var invalid = await handler.UpdateAsync(new("unknown"), CancellationToken.None);
        await Assert.That(invalid.IsSuccess).IsFalse();
        db.ChangeTracker.Clear();
        var saved = await handler.ReadAsync(CancellationToken.None);
        await Assert.That(saved.Value.GuideCompletedSteps).IsEquivalentTo(["dashboard", "finances"]);
        await Assert.That(saved.Value.GuideCompletedVersion).IsEqualTo(GuideHandler.Version);
        await Assert.That(saved.Value.GuideCompletedAt).IsNull();
    }

    [Test]
    public async Task NewGuideVersionResetsOnlySubtourProgress()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var user = User.Init("version", "Guide version", null);
        user.CompleteGuideStep(1, "dashboard", new DateTime(2026, 11, 9, 8, 0, 0, DateTimeKind.Utc));
        user.CompleteGuideStep(1, "finances");
        user.CompleteGuideStep(2, "resources");
        user.CompleteGuideStep(1, "limits");
        db.Users.Add(user);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        var saved = await db.Users.SingleAsync(account => account.Id == user.Id);
        await Assert.That(saved.GuideCompletedVersion).IsEqualTo(2);
        await Assert.That(saved.GuideCompletedSteps).IsEquivalentTo(["resources"]);
        await Assert.That(saved.GuideCompletedAt).IsNull();
    }

    [Test]
    public async Task FullTourCompletionUsesServerClockAndUpdatesOnReplayOnly()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var user = User.Init("full-tour", "Tour user", null);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var current = new CurrentUser { User = new SimpleAuthUser(user.Id, user.AuthId, Guid.Empty, user.Name, null, true) };
        var clock = new TourTimeProvider(new DateTimeOffset(2026, 11, 10, 9, 0, 0, TimeSpan.Zero));
        var handler = new GuideHandler(db, current, clock);
        var section = await handler.UpdateAsync(new("dashboard"), CancellationToken.None);
        await Assert.That(section.Value.GuideCompletedAt).IsNull();
        await handler.UpdateAsync(new("navigation", true), CancellationToken.None);
        db.ChangeTracker.Clear();
        var saved = await handler.ReadAsync(CancellationToken.None);
        await Assert.That(saved.Value.GuideCompletedAt).IsEqualTo(clock.UtcNow.UtcDateTime);
        var first = saved.Value.GuideCompletedAt;
        clock.UtcNow = clock.UtcNow.AddDays(1);
        var replayedSection = await handler.UpdateAsync(new("dashboard"), CancellationToken.None);
        await Assert.That(replayedSection.Value.GuideCompletedAt).IsEqualTo(first);
        var rejected = await handler.UpdateAsync(new("unknown", true), CancellationToken.None);
        await Assert.That(rejected.IsError).IsTrue();
        var replayedTour = await handler.UpdateAsync(new("navigation", true), CancellationToken.None);
        await Assert.That(replayedTour.Value.GuideCompletedAt).IsEqualTo(clock.UtcNow.UtcDateTime);
        await Assert.That(replayedTour.Value.GuideCompletedSteps).IsEquivalentTo(["dashboard", "navigation"]);
    }

    [Test]
    public async Task ResetClearsOnlyTheCurrentUsersGuideAndPersistsAcrossSessions()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var user = User.Init("reset-guide", "Keep my profile", null);
        var completedAt = new DateTime(2026, 11, 10, 9, 0, 0, DateTimeKind.Utc);
        user.CompleteOnboarding(user.Name, AnalyticsConsent.Declined, completedAt);
        user.CompleteGuideStep(GuideHandler.Version, "dashboard", completedAt);
        var other = User.Init("other-guide", "Other user", null);
        other.CompleteGuideStep(GuideHandler.Version, "finances", completedAt);
        db.Users.AddRange(user, other);
        await db.SaveChangesAsync();
        var current = new CurrentUser { User = new SimpleAuthUser(user.Id, user.AuthId, Guid.Empty, user.Name, null, true) };
        var handler = new GuideHandler(db, current, TimeProvider.System);
        var reset = await handler.ResetAsync(CancellationToken.None);
        await Assert.That(reset.IsSuccess).IsTrue();
        await handler.ResetAsync(CancellationToken.None);

        await using var reloaded = PostgreSqlTestDatabase.CreateDbContext();
        var saved = await reloaded.Users.SingleAsync(item => item.Id == user.Id);
        await Assert.That(saved.GuideCompletedVersion).IsEqualTo(0);
        await Assert.That(saved.GuideCompletedSteps).IsEmpty();
        await Assert.That(saved.GuideCompletedAt).IsNull();
        await Assert.That(saved.Name).IsEqualTo("Keep my profile");
        await Assert.That(saved.OnboardingCompletedAt).IsEqualTo(completedAt);
        await Assert.That(saved.AnalyticsConsent).IsEqualTo(AnalyticsConsent.Declined);
        var untouched = await reloaded.Users.SingleAsync(item => item.Id == other.Id);
        await Assert.That(untouched.GuideCompletedSteps).IsEquivalentTo(["finances"]);
        await Assert.That(untouched.GuideCompletedAt).IsEqualTo(completedAt);
    }

    [Test]
    public async Task SkipRecordsServerTimeWithoutCompletingUnvisitedSectionsAndResetClearsIt()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var user = User.Init("skip-guide", "Skip guide", null);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var current = new CurrentUser { User = new SimpleAuthUser(user.Id, user.AuthId, Guid.Empty, user.Name, null, true) };
        var clock = new TourTimeProvider(new DateTimeOffset(2026, 11, 10, 9, 0, 0, TimeSpan.Zero));
        var handler = new GuideHandler(db, current, clock);
        var empty = await handler.UpdateAsync(new(), CancellationToken.None);
        await Assert.That(empty.IsError).IsTrue();
        var skipped = await handler.UpdateAsync(new(CompletedTour: true), CancellationToken.None);
        await Assert.That(skipped.Value.GuideCompletedAt).IsEqualTo(clock.UtcNow.UtcDateTime);
        await Assert.That(skipped.Value.GuideCompletedSteps).IsEmpty();
        await Assert.That(skipped.Value.GuideCompletedVersion).IsEqualTo(GuideHandler.Version);
        db.ChangeTracker.Clear();
        var saved = await handler.ReadAsync(CancellationToken.None);
        await Assert.That(saved.Value.GuideCompletedAt).IsEqualTo(clock.UtcNow.UtcDateTime);
        await handler.UpdateAsync(new("dashboard"), CancellationToken.None);
        var skippedAgain = await handler.UpdateAsync(new(CompletedTour: true), CancellationToken.None);
        await Assert.That(skippedAgain.Value.GuideCompletedSteps).IsEquivalentTo(["dashboard"]);
        var reset = await handler.ResetAsync(CancellationToken.None);
        await Assert.That(reset.Value.GuideCompletedAt).IsNull();
        await Assert.That(reset.Value.GuideCompletedVersion).IsEqualTo(0);
        await Assert.That(reset.Value.GuideCompletedSteps).IsEmpty();
    }

    private sealed class TourTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public DateTimeOffset UtcNow { get; set; } = utcNow;
        public override DateTimeOffset GetUtcNow() => UtcNow;
    }
}
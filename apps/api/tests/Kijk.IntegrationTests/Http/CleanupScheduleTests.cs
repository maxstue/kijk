using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Spaces;
using Kijk.IntegrationTests.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Wolverine.Runtime;
using Wolverine.Tracking;

namespace Kijk.IntegrationTests.Http;

// The cleanups run as recurring Wolverine messages. Their effect through the durable queue is tested in
// SpaceInvitationHttpTests and ImportHttpTests; this class checks the schedules and the error handling.
[NotInParallel]
public class CleanupScheduleTests
{
    // A null value removes the test host's override, so the production default applies.
    private static readonly Dictionary<string, string?> ProductionDefault = new() { ["Jobs:CleanupSchedulesEnabled"] = null };

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    // Also empties the Wolverine schema, so the occurrences pre-scheduled here cannot fire in a later test.
    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task CleanupsAreScheduledHourlyByDefault()
    {
        await using var host = await SpaceApiHost.StartAsync("user_cleanup", jobsEnabled: true, configuration: ProductionDefault);

        // The schedule names default to the message type names.
        var schedules = host.Host.Services.GetRequiredService<IWolverineRuntime>().Options.Schedules;
        var invitations = schedules.FindByName(nameof(CleanupInvitations));
        var imports = schedules.FindByName(nameof(CleanupImports));

        await Assert.That(invitations?.MessageType).IsEqualTo(typeof(CleanupInvitations));
        await Assert.That(imports?.MessageType).IsEqualTo(typeof(CleanupImports));
        await Assert.That(invitations!.Schedule.Expression).IsEqualTo("0 * * * *");
        await Assert.That(imports!.Schedule.Expression).IsEqualTo("0 * * * *");
    }

    [Test]
    public async Task TestHostsDoNotScheduleCleanups()
    {
        await using var host = await SpaceApiHost.StartAsync("user_cleanup", jobsEnabled: true);

        var schedules = host.Host.Services.GetRequiredService<IWolverineRuntime>().Options.Schedules;

        await Assert.That(schedules.FindByName(nameof(CleanupInvitations))).IsNull();
        await Assert.That(schedules.FindByName(nameof(CleanupImports))).IsNull();
    }

    [Test]
    public async Task FailedCleanupsAreDiscardedInsteadOfRetriedOrDeadLettered()
    {
        // NpgsqlException also has a global retry rule; the cleanup rule must win over it.
        await using var host = await SpaceApiHost.StartAsync(
            "user_cleanup",
            jobsEnabled: true,
            configureServices: services => services.AddSingleton<TimeProvider, FailingTimeProvider>());

        var session = await host.Host.TrackActivity()
            .DoNotAssertOnExceptionsDetected()
            .Timeout(TimeSpan.FromSeconds(15))
            .ExecuteAndWaitAsync(context => context.PublishAsync(new CleanupInvitations()));

        await Assert.That(session.Discarded.Envelopes().Count()).IsEqualTo(1);
        await Assert.That(session.MovedToErrorQueue.Envelopes().Count()).IsEqualTo(0);
    }

    private sealed class FailingTimeProvider : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => throw new NpgsqlException("Simulated database failure");
    }
}
using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Spaces;
using Kijk.IntegrationTests.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Wolverine.Runtime;
using Wolverine.Runtime.Handlers;

namespace Kijk.IntegrationTests.Http;

// The cleanups run as recurring Wolverine messages. Their effect through the durable queue is tested in
// SpaceInvitationHttpTests and ImportHttpTests; this class checks the schedules and the error handling.
[NotInParallel]
public class CleanupScheduleTests
{
    private static readonly Dictionary<string, string?> SchedulesEnabled = new() { ["Jobs:CleanupSchedulesEnabled"] = "true" };

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task CleanupsAreScheduledHourly()
    {
        await using var host = await SpaceApiHost.StartAsync("user_cleanup", jobsEnabled: true, configuration: SchedulesEnabled);
        var runtime = host.Host.Services.GetRequiredService<IWolverineRuntime>();

        try
        {
            // The schedule names default to the message type names.
            var invitations = runtime.Options.Schedules.FindByName(nameof(CleanupInvitations));
            var imports = runtime.Options.Schedules.FindByName(nameof(CleanupImports));

            await Assert.That(invitations?.MessageType).IsEqualTo(typeof(CleanupInvitations));
            await Assert.That(imports?.MessageType).IsEqualTo(typeof(CleanupImports));
            await Assert.That(invitations!.Schedule.Expression).IsEqualTo("0 * * * *");
            await Assert.That(imports!.Schedule.Expression).IsEqualTo("0 * * * *");
        }
        finally
        {
            // Respawn does not reset the Wolverine schema: drop the pre-scheduled next occurrences, so they cannot fire
            // in a later test.
            await runtime.Storage.Admin.ClearAllAsync();
        }
    }

    [Test]
    [Arguments(typeof(CleanupInvitations))]
    [Arguments(typeof(CleanupImports))]
    public async Task FailedCleanupsAreDiscardedInsteadOfDeadLettered(Type messageType)
    {
        await using var host = await SpaceApiHost.StartAsync("user_cleanup", jobsEnabled: true);

        var chain = host.Host.Services.GetRequiredService<HandlerGraph>().ChainFor(messageType);

        // CleanupFailurePolicy adds its rules on top of the global retry rules.
        await Assert.That(chain).IsNotNull();
        await Assert.That(chain!.Failures.Count()).IsGreaterThan(0);
    }

    [Test]
    public async Task TestHostsDoNotScheduleCleanups()
    {
        await using var host = await SpaceApiHost.StartAsync("user_cleanup", jobsEnabled: true);

        var schedules = host.Host.Services.GetRequiredService<IWolverineRuntime>().Options.Schedules;

        await Assert.That(schedules.FindByName(nameof(CleanupInvitations))).IsNull();
        await Assert.That(schedules.FindByName(nameof(CleanupImports))).IsNull();
    }
}
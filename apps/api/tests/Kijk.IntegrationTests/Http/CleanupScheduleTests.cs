using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Spaces;
using Kijk.IntegrationTests.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Wolverine;
using Wolverine.Runtime;

namespace Kijk.IntegrationTests.Http;

// The cleanups run as recurring Wolverine messages; their logic is covered by the handler tests.
[NotInParallel]
public class CleanupScheduleTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task CleanupsAreScheduledAndReachTheirHandlers()
    {
        await using var host = await SpaceApiHost.StartAsync("user_cleanup", jobsEnabled: true);
        var schedules = host.Services.GetRequiredService<IWolverineRuntime>().Options.Schedules;

        // The schedule names default to the message type names.
        await Assert.That(schedules.FindByName(nameof(CleanupInvitations))?.MessageType).IsEqualTo(typeof(CleanupInvitations));
        await Assert.That(schedules.FindByName(nameof(CleanupImports))?.MessageType).IsEqualTo(typeof(CleanupImports));

        // InvokeAsync throws when no handler is registered, for example after a missing discovery entry.
        await using var scope = host.Services.CreateAsyncScope();
        var bus = scope.ServiceProvider.GetRequiredService<IMessageBus>();
        await bus.InvokeAsync(new CleanupInvitations());
        await bus.InvokeAsync(new CleanupImports());
    }
}
using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Jobs;
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
    [Arguments(JobsDependencyInjection.CleanupInvitationsSchedule, typeof(CleanupInvitations))]
    [Arguments(JobsDependencyInjection.CleanupImportsSchedule, typeof(CleanupImports))]
    public async Task CleanupsAreScheduledHourly(string name, Type messageType)
    {
        await using var host = await SpaceApiHost.StartAsync("user_cleanup", jobsEnabled: true);

        var schedule = host.Services.GetRequiredService<IWolverineRuntime>().Options.Schedules.FindByName(name);

        await Assert.That(schedule).IsNotNull();
        await Assert.That(schedule!.MessageType).IsEqualTo(messageType);
        await Assert.That(schedule.Schedule.Expression).IsEqualTo("0 * * * *");
    }

    [Test]
    public async Task CleanupMessagesReachTheirHandlers()
    {
        await using var host = await SpaceApiHost.StartAsync("user_cleanup", jobsEnabled: true);
        await using var scope = host.Services.CreateAsyncScope();
        var bus = scope.ServiceProvider.GetRequiredService<IMessageBus>();

        // InvokeAsync throws when no handler is registered, for example after a missing discovery entry.
        await bus.InvokeAsync(new CleanupInvitations(DateTimeOffset.UtcNow));
        await bus.InvokeAsync(new CleanupImports(DateTimeOffset.UtcNow));
    }
}
using Kijk.Infrastructure.Jobs;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Wolverine;

namespace Kijk.IntegrationTests.Configuration;

// Disabled cleanup schedules stop all deletions, so outside the test hosts they must not go unnoticed.
public class JobOptionsExtensionTests
{
    [Test]
    [Arguments(false, "Production", true)]
    [Arguments(false, JobsDependencyInjection.TestingEnvironment, false)]
    [Arguments(true, "Production", false)]
    public async Task WarnsWhenCleanupSchedulesAreDisabledOutsideTheTests(bool schedulesEnabled, string environmentName, bool warns)
    {
        var logger = new RecordingLogger();
        var extension = new JobsDependencyInjection.JobOptionsExtension(
            Options.Create(new JobsOptions { CleanupSchedulesEnabled = schedulesEnabled }),
            new TestEnvironment(environmentName),
            logger);

        extension.Configure(new WolverineOptions());

        await Assert.That(logger.Warnings.Count).IsEqualTo(warns ? 1 : 0);
    }

    private sealed class TestEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "Kijk";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class RecordingLogger : ILogger<JobsDependencyInjection.JobOptionsExtension>
    {
        public List<string> Warnings { get; } = [];

        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            if (logLevel == LogLevel.Warning)
            {
                Warnings.Add(formatter(state, exception));
            }
        }
    }
}
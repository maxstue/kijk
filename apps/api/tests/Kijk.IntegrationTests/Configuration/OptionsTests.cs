using Kijk.Infrastructure;
using Kijk.Infrastructure.Ai;
using Kijk.Infrastructure.Auth;
using Kijk.Infrastructure.Configuration;
using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Jobs;
using Kijk.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Wolverine;

namespace Kijk.IntegrationTests.Configuration;

public class OptionsTests
{
    [Test]
    public async Task GeneratedBindingPreservesOptionsMonitorReloads()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Ai:Enabled"] = "true"
        }).Build();
        using var services = new ServiceCollection().AddConfigurationOptions(configuration).BuildServiceProvider();
        var monitor = services.GetRequiredService<IOptionsMonitor<AiOptions>>();
        await Assert.That(monitor.CurrentValue.Enabled).IsTrue();

        configuration["Ai:Enabled"] = "false";
        configuration.Reload();

        await Assert.That(monitor.CurrentValue.Enabled).IsFalse();
    }

    [Test]
    public async Task JwtConfigurationUsesTheBoundAuthOptions()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Auth:Authority"] = "https://identity.example.test",
            ["Auth:ClockSkewInSeconds"] = "30",
            ["Cors:0"] = "https://client.example.test"
        }).Build();
        using var services = new ServiceCollection().AddInfrastructure(configuration).BuildServiceProvider();
        var jwt = services.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>().Get(JwtBearerDefaults.AuthenticationScheme);

        await Assert.That(jwt.Authority).IsEqualTo("https://identity.example.test");
        await Assert.That(jwt.TokenValidationParameters.ClockSkew).IsEqualTo(TimeSpan.FromSeconds(30));
    }

    [Test]
    public async Task AllApplicationOptionsAreBoundAndValidated()
    {
        using var services = CreateServices(new Dictionary<string, string?>
        {
            ["Auth:ClockSkewInSeconds"] = "30",
            ["Auth:AuthorizedParties:0"] = "https://client.example.test",
            ["Persistence:SlowQueryThreshold"] = "250",
            ["Ai:Endpoint"] = "https://ai.example.test/v1",
            ["Ai:Model"] = "test-model",
            ["Ai:RequestTimeout"] = "00:00:45"
        });

        services.GetRequiredService<IStartupValidator>().Validate();
        var auth = services.GetRequiredService<IOptions<AuthOptions>>().Value;
        var connection = services.GetRequiredService<IOptions<ConnectionOptions>>().Value;
        var persistence = services.GetRequiredService<IOptions<PersistenceOptions>>().Value;
        var ai = services.GetRequiredService<IOptions<AiOptions>>().Value;

        await Assert.That(auth.Authority).IsEqualTo("https://identity.example.test");
        await Assert.That(auth.ClockSkewInSeconds).IsEqualTo(30);
        await Assert.That(auth.AuthorizedParties[0]).IsEqualTo("https://client.example.test");
        await Assert.That(connection.DefaultConnection).IsEqualTo("Host=localhost;Database=kijk-options-tests");
        await Assert.That(persistence.SlowQueryThreshold).IsEqualTo(250);
        await Assert.That(ai.Endpoint.AbsoluteUri).IsEqualTo("https://ai.example.test/v1");
        await Assert.That(ai.Model).IsEqualTo("test-model");
        await Assert.That(ai.RequestTimeout).IsEqualTo(TimeSpan.FromSeconds(45));
    }

    [Test]
    public async Task OptionalProviderKeysAreNotRequiredForStartup()
    {
        using var services = CreateServices();
        services.GetRequiredService<IStartupValidator>().Validate();
        await Assert.That(services.GetRequiredService<IOptions<AiOptions>>().Value.ApiKey).IsNullOrEmpty();
        await Assert.That(services.GetRequiredService<IOptions<AuthOptions>>().Value.SecretKey).IsNullOrEmpty();
    }

    [Test]
    public async Task ImportAndJobOptionsAreBoundAndValidatedThroughDependencyInjection()
    {
        using var services = CreateServices(new Dictionary<string, string?>
        {
            ["Fingerprint:KeyVersion"] = "2",
            ["Jobs:DurabilityMode"] = "Solo"
        });

        services.GetRequiredService<IStartupValidator>().Validate();
        var fingerprint = services.GetRequiredService<IOptions<FingerprintOptions>>().Value;
        var keyRing = services.GetRequiredService<IOptions<KeyRingOptions>>().Value;
        var jobs = services.GetRequiredService<IOptions<JobsOptions>>().Value;

        await Assert.That(fingerprint.KeyVersion).IsEqualTo(2);
        await Assert.That(Convert.FromBase64String(fingerprint.MasterKey).Length).IsEqualTo(32);
        await Assert.That(Convert.FromBase64String(keyRing.KeyEncryptionKey).Length).IsEqualTo(32);
        await Assert.That(jobs.DurabilityMode).IsEqualTo(DurabilityMode.Solo);
    }

    [Test]
    public async Task MissingJobSettingsKeepTheBalancedDefault()
    {
        using var services = CreateServices();

        services.GetRequiredService<IStartupValidator>().Validate();

        await Assert.That(services.GetRequiredService<IOptions<JobsOptions>>().Value.DurabilityMode)
            .IsEqualTo(DurabilityMode.Balanced);
    }

    [Test]
    [Arguments("Fingerprint:MasterKey", null)]
    [Arguments("Fingerprint:MasterKey", "this-must-never-appear-in-validation-errors")]
    [Arguments("DataProtection:KeyEncryptionKey", "this-must-never-appear-in-validation-errors")]
    [Arguments("Fingerprint:KeyVersion", "0")]
    [Arguments("Jobs:DurabilityMode", "999")]
    [Arguments("Auth:Authority", null)]
    [Arguments("Auth:Authority", "ftp://identity.example.test")]
    [Arguments("Auth:ClockSkewInSeconds", "-1")]
    [Arguments("ConnectionStrings:DefaultConnection", null)]
    [Arguments("ConnectionStrings:DefaultConnection", "Unknown=this-must-never-appear-in-validation-errors")]
    [Arguments("Persistence:SlowQueryThreshold", "-1")]
    [Arguments("Ai:Endpoint", "ftp://ai.example.test")]
    [Arguments("Ai:Model", "")]
    [Arguments("Ai:RequestTimeout", "00:00:00")]
    [Arguments("Ai:RequestTimeout", "-00:00:01")]
    public async Task InvalidOptionsFailStartupValidation(string setting, string? value)
    {
        using var services = CreateServices(new Dictionary<string, string?> { [setting] = value });

        var exception = await Assert.That(() => services.GetRequiredService<IStartupValidator>().Validate())
            .Throws<OptionsValidationException>();

        await Assert.That(exception!.Message).DoesNotContain("this-must-never-appear-in-validation-errors");
    }

    [Test]
    [Arguments(31)]
    [Arguments(33)]
    public async Task ValidBase64WithTheWrongKeyLengthFailsStartupValidation(int length)
    {
        using var services = CreateServices(new Dictionary<string, string?>
        {
            ["DataProtection:KeyEncryptionKey"] = Convert.ToBase64String(new byte[length])
        });

        await Assert.That(() => services.GetRequiredService<IStartupValidator>().Validate())
            .Throws<OptionsValidationException>();
    }

    private static ServiceProvider CreateServices(IDictionary<string, string?>? overrides = null)
    {
        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=kijk-options-tests",
            ["Auth:Authority"] = "https://identity.example.test",
            ["Fingerprint:MasterKey"] = Convert.ToBase64String(new byte[32]),
            ["DataProtection:KeyEncryptionKey"] = Convert.ToBase64String(new byte[32])
        };
        if (overrides is not null)
        {
            foreach (var (key, value) in overrides)
            {
                settings[key] = value;
            }
        }

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddConfigurationOptions(configuration).AddImports();
        return services.BuildServiceProvider();
    }
}
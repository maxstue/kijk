using System.Net;
using System.Text;
using Microsoft.Extensions.DependencyInjection;
using PostHog;
using PostHog.Config;

namespace Kijk.IntegrationTests.Telemetry;

/// <summary>A real PostHog client whose HTTP traffic is recorded and answered locally; used for error tracking.</summary>
internal sealed class FakePostHog : HttpMessageHandler, IAsyncDisposable
{
    private readonly ServiceProvider provider;

    public FakePostHog(Action<PostHogOptions>? configure = null)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddPostHog(builder => builder.PostConfigure(options =>
        {
            options.ProjectToken = "phc_test";
            options.HostUrl = new("https://posthog.example.test");
            options.FlushAt = 1;
            options.EnableCompression = false;
            options.MaxRetries = 0;
            options.FeatureFlagRequestMaxRetries = 0;
            configure?.Invoke(options);
        }));
        services.ConfigureAll<Microsoft.Extensions.Http.HttpClientFactoryOptions>(options =>
            options.HttpMessageHandlerBuilderActions.Add(builder => builder.PrimaryHandler = this));
        provider = services.BuildServiceProvider();
        Client = provider.GetRequiredService<IPostHogClient>();
    }

    public IPostHogClient Client { get; }

    /// <summary>Gets the bodies of all requests, by path.</summary>
    public List<(string Path, string Body)> Requests { get; } = [];

    public async ValueTask DisposeAsync() => await provider.DisposeAsync();

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
        var path = request.RequestUri!.AbsolutePath;
        lock (Requests)
        {
            Requests.Add((path, body));
        }

        return new(HttpStatusCode.OK) { Content = new StringContent("{\"status\":1}", Encoding.UTF8, "application/json") };
    }
}
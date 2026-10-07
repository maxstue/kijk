using System.ClientModel;
using Kijk.Application.Shared.Ai;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OpenAI;

namespace Kijk.Infrastructure.Ai;

/// <summary>Registers the AI services.</summary>
internal static class AiDependencyInjection
{
    /// <summary>
    /// Registers the configured provider (Mistral by default) as <see cref="IChatClient" /> through its OpenAI-compatible
    /// API, so switching to another EU provider such as IONOS or STACKIT is a configuration change. Prompts and answers
    /// are never logged.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The application configuration.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddAi(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AiOptions>(configuration.GetSection(AiOptions.SectionName));
        services.AddScoped<IAiGate, AiGate>();
        services.AddSingleton<IChatClient>(provider =>
        {
            var options = provider.GetRequiredService<IOptions<AiOptions>>().Value;
            if (string.IsNullOrWhiteSpace(options.ApiKey))
            {
                return new UnconfiguredChatClient();
            }

            // The SDK retries rate limits and server errors with backoff; each attempt is limited by the timeout.
            var client = new OpenAIClient(
                new ApiKeyCredential(options.ApiKey),
                new OpenAIClientOptions { Endpoint = options.Endpoint, NetworkTimeout = options.RequestTimeout });
            return client.GetChatClient(options.Model).AsIChatClient();
        });

        return services;
    }

    /// <summary>Stands in when no API key is configured; <see cref="AiGate" /> prevents any call to it.</summary>
    private sealed class UnconfiguredChatClient : IChatClient
    {
        public Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("No AI provider is configured.");

        public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("No AI provider is configured.");

        public object? GetService(Type serviceType, object? serviceKey = null) => null;

        public void Dispose()
        {
        }
    }
}
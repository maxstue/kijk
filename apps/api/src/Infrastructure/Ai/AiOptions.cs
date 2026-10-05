using Kijk.Shared;

namespace Kijk.Infrastructure.Ai;

/// <summary>
/// Provider-neutral AI settings. Any OpenAI-compatible provider works by changing <see cref="Endpoint" />,
/// <see cref="Model" /> and <see cref="ApiKey" />; the key comes from Infisical as <c>Ai__ApiKey</c>.
/// </summary>
public sealed class AiOptions : IConfigOptions
{
    /// <inheritdoc />
    public static string SectionName => "Ai";

    /// <summary>
    /// Gets or sets whether AI calls are allowed; the server-side kill switch for every AI call. Keep it off for real
    /// user data until the paid plan with training opt-out and confirmed zero data retention is active.
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>Gets or sets the API key.</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Gets or sets the OpenAI-compatible endpoint; Mistral's EU endpoint keeps requests on EU/EFTA infrastructure.</summary>
    public Uri Endpoint { get; set; } = new("https://api.eu.mistral.ai/v1");

    /// <summary>Gets or sets the pinned model version, so behaviour does not change silently.</summary>
    public string Model { get; set; } = "mistral-small-2603";

    /// <summary>Gets or sets the timeout of a single HTTP request.</summary>
    public TimeSpan RequestTimeout { get; set; } = TimeSpan.FromSeconds(20);
}
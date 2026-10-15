using System.ComponentModel.DataAnnotations;
using Kijk.Infrastructure.Configuration;

namespace Kijk.Infrastructure.Ai;

/// <summary>
/// Provider-neutral AI settings. Any OpenAI-compatible provider works by changing <see cref="Endpoint" />,
/// <see cref="Model" /> and <see cref="ApiKey" />; the key comes from Infisical as <c>Ai__ApiKey</c>.
/// </summary>
public sealed class AiOptions
{
    /// <summary>Gets the configuration section name.</summary>
    public static string SectionName => "Ai";

    /// <summary>
    /// Gets or sets whether AI calls are allowed; the server-side kill switch for every AI call. Keep it off for real
    /// user data until the paid plan with training opt-out and confirmed zero data retention is active.
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>Gets or sets the API key.</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Gets or sets the OpenAI-compatible endpoint; Mistral's EU endpoint keeps requests on EU/EFTA infrastructure.</summary>
    [Required]
    [HttpUrl]
    public Uri Endpoint { get; set; } = new("https://api.eu.mistral.ai/v1");

    /// <summary>Gets or sets the pinned model version, so behaviour does not change silently.</summary>
    [Required]
    public string Model { get; set; } = "mistral-small-2603";

    /// <summary>Gets or sets the timeout of a single HTTP request.</summary>
    [PositiveTimeSpan]
    public TimeSpan RequestTimeout { get; set; } = TimeSpan.FromSeconds(20);
}
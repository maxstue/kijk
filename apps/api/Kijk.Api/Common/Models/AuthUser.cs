using System.Text.Json.Serialization;

namespace Kijk.Api.Common.Models;

public class AuthUser
{
    [JsonPropertyName("id")] public string Id { get; set; }

    [JsonPropertyName("given_name")] public string GivenName { get; set; }

    [JsonPropertyName("email")] public string Email { get; set; }
}

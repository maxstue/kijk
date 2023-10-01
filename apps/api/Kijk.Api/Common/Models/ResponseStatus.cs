using System.Text.Json.Serialization;

namespace Kijk.Api.Common.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ResponseStatus
{
    Success,
    Error
}

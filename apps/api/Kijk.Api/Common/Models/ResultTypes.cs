using System.Text.Json.Serialization;

using Kijk.Api.Common.Utils;

namespace Kijk.Api.Common.Models;

/// <summary>
///     Error types.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ErrorType
{
    Failure,
    Validation,
    Conflict,
    NotFound,
    Unexpected
}

/// <summary>
///     Success types.
///     Only used to determine the HttpStatusCode in <see cref="ResponseUtils.CreateTypedResult{TP}" />.
/// </summary>
public enum SuccessType
{
    Ok,
    Created
}

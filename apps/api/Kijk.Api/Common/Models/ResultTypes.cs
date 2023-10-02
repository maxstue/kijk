using Kijk.Api.Common.Utils;

using NetEscapades.EnumGenerators;

namespace Kijk.Api.Common.Models;

/// <summary>
///     Error types.
/// </summary>
[EnumExtensions]
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
[EnumExtensions]
public enum SuccessType
{
    Ok,
    Created
}

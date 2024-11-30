using Kijk.Api.Common.Utils;

using NetEscapades.EnumGenerators;

namespace Kijk.Api.Common.Models;

/// <summary>
///     Error types.
/// </summary>
[EnumExtensions]
public enum ErrorType
{
    Basic,
    Validation,
    Conflict,
    NotFound,
    Authentication,
    Authorization,
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
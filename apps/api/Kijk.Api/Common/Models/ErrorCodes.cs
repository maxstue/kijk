namespace Kijk.Api.Common.Models;

/// <summary>
///     Class to represent base custom error codes.
///     Only use these Code if the error is not feature specific or is used not inside a feature.
///     Every feature should have its own prefix.
/// </summary>
/// <remarks>
///     Code explanation:
///     Prefix = "E", stands for "Error"
///     Group = "x amount of characters", specifies the group of the error
///     Suffix = "4 digit number", stands for a number (sequentially counting - 0001,0002,...) in group
///     example:
///     "EA0001": E = Error, A = Auth group, 0001 = first error in group
/// </remarks>
public readonly record struct ErrorCodes
{
    public const string DefaultError = "E0001";
    public const string UnexpectedError = "EU0001";
    public const string NotFoundError = "ENF0001";

    public const string ValidationError = "EV0001";

    public const string AuthenticationError = "EA0001";
    public const string AuthorizationError = "EA0002";
}

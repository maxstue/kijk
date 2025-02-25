namespace Kijk.Shared;

/// <summary>
///     Class to represent base custom error codes.
///     Only use these Code if the error is not feature specific or is used not inside a feature.
///     Every feature should have its own prefix.
/// </summary>
/// <remarks>
///     Code explanation:
///     Prefix = "E", stands for "Error"
///     Group/feature = "x amount of characters", specifies the group of the error
///     Suffix = "4 digit number", stands for a number (sequentially counting - 0001,0002,...) in group
///     example:
///     "EA0001": E = Error, A = Auth group/feature, 0001 = first error in group
/// </remarks>
public readonly record struct ErrorCodes
{
    public const string DefaultError = "E0001";
    public const string UnexpectedError = "E0002";
    public const string NotFoundError = "E0003";

    public const string ValidationError = "E0004";

    public const string AuthenticationError = "E0005";
    public const string AuthorizationError = "E0006";
}
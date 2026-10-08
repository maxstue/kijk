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
    /// <summary>Generic error without a more specific code.</summary>
    public const string DefaultError = "E0001";
    /// <summary>Unexpected error, typically an unhandled exception.</summary>
    public const string UnexpectedError = "E0002";
    /// <summary>The requested entity does not exist or is not visible to the user.</summary>
    public const string NotFoundError = "E0003";

    /// <summary>The request failed validation.</summary>
    public const string ValidationError = "E0004";

    /// <summary>The caller is not authenticated.</summary>
    public const string AuthenticationError = "E0005";
    /// <summary>The caller is authenticated but not allowed to perform the action.</summary>
    public const string AuthorizationError = "E0006";
    /// <summary>The request conflicts with the current state, e.g. a duplicate.</summary>
    public const string ConflictError = "E0007";
}
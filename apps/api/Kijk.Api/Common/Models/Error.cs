namespace Kijk.Api.Common.Models;

/// <summary>
///     Represents an error.
/// </summary>
public readonly record struct Error
{
    /// <summary>
    ///     Gets the error type.
    /// </summary>
    public ErrorType Type { get; }

    /// <summary>
    ///     Gets the unique error code.
    /// </summary>
    public string Code { get; }

    /// <summary>
    ///     Gets the error description.
    /// </summary>
    public string Message { get; }

    private Error(string code, string message, ErrorType type)
    {
        Code = code;
        Message = message;
        Type = type;
    }

    /// <summary>
    ///     Creates an <see cref="Error" /> of type <see cref="ErrorType.Failure" /> from a code and description.
    /// </summary>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static Error Failure(
        string code = ErrorCodes.DefaultError,
        string description = "A failure has occurred.")
    {
        return new Error(code, description, ErrorType.Failure);
    }

    /// <summary>
    ///     Creates an <see cref="Error" /> of type <see cref="ErrorType.Unexpected" /> from a code and description.
    /// </summary>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static Error Unexpected(
        string code = ErrorCodes.UnexpectedError,
        string description = "An unexpected error has occurred.")
    {
        return new Error(code, description, ErrorType.Unexpected);
    }

    /// <summary>
    ///     Creates an <see cref="Error" /> of type <see cref="ErrorType.Validation" /> from a code and description.
    /// </summary>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static Error Validation(
        string code = ErrorCodes.ValidationError,
        string description = "A validation error has occurred.")
    {
        return new Error(code, description, ErrorType.Validation);
    }

    /// <summary>
    ///     Creates an <see cref="Error" /> of type <see cref="ErrorType.NotFound" /> from a code and description.
    /// </summary>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static Error NotFound(
        string code = ErrorCodes.NotFoundError,
        string description = "A 'Not Found' error has occurred.")
    {
        return new Error(code, description, ErrorType.NotFound);
    }

    /// <summary>
    ///     Creates an <see cref="Error" /> with the given numeric <paramref name="type" />,
    ///     <paramref name="code" />, and <paramref name="description" />.
    /// </summary>
    /// <param name="type">An integer value which represents the type of error that occurred.</param>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static Error Custom(
        ErrorType type,
        string code,
        string description)
    {
        return new Error(code, description, type);
    }
}

namespace Kijk.Api.Common.Models;

/// <summary>
///     Represents an error.
/// </summary>
public readonly record struct AppError
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

    private AppError(string code, string message, ErrorType type)
    {
        Code = code;
        Message = message;
        Type = type;
    }

    /// <summary>
    ///     Creates an basic <see cref="AppError" /> of type <see cref="ErrorType.Basic" /> from a code and description.
    /// </summary>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static AppError Basic(
        string code = AppErrorCodes.DefaultError,
        string? description = "An error has occurred.") => new(code, $"Error, {description}", ErrorType.Basic);

    /// <summary>
    ///     Creates an <see cref="AppError" /> of type <see cref="ErrorType.Unexpected" /> from a code and description.
    /// </summary>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static AppError Unexpected(
        string code = AppErrorCodes.UnexpectedError,
        string description = "An unexpected error has occurred.") => new(code, $"An 'unexpected' error, {description}", ErrorType.Unexpected);

    /// <summary>
    ///     Creates an <see cref="AppError" /> of type <see cref="ErrorType.Validation" /> from a code and description.
    /// </summary>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static AppError Validation(
        string code = AppErrorCodes.ValidationError,
        string description = "A 'validation' error has occurred.") => new(code, description, ErrorType.Validation);

    /// <summary>
    ///     Creates an <see cref="AppError" /> of type <see cref="ErrorType.NotFound" /> from a code and description.
    /// </summary>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static AppError NotFound(
        string code = AppErrorCodes.NotFoundError,
        string description = "A 'Not Found' error has occurred.") => new(code, $"'Not found' error, {description}", ErrorType.NotFound);

    /// <summary>
    ///     Creates an <see cref="AppError" /> with the given numeric <paramref name="type" />,
    ///     <paramref name="code" />, and <paramref name="description" />.
    /// </summary>
    /// <param name="type">An integer value which represents the type of error that occurred.</param>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static AppError Custom(
        ErrorType type,
        string code,
        string description) => new(code, description, type);
}
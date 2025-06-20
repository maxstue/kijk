using Microsoft.AspNetCore.Http;
using NetEscapades.EnumGenerators;

namespace Kijk.Shared;

/// <summary>
/// Error types.
/// </summary>
[EnumExtensions]
public enum ErrorType
{
    Validation,
    Conflict,
    NotFound,
    Authentication,
    Authorization,
    Unexpected
}

/// <summary>
/// Represents an error.
/// </summary>
[System.Diagnostics.CodeAnalysis.SuppressMessage(
    "Naming",
    "CA1716:Identifiers should not match keywords",
    Justification = "Error struct is part of the Result pattern and is intentional.")]
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
    public string Description { get; }

    private Error(string code, string description, ErrorType type)
    {
        Code = code;
        Description = description;
        Type = type;
    }

    /// <summary>
    /// Creates an <see cref="Error" /> of type <see cref="ErrorType.Unexpected" /> from a code and description.
    /// </summary>
    /// <param name="description">The error description.</param>
    public static Error Unexpected(string description = "An unexpected error has occurred.") =>
        new(ErrorCodes.UnexpectedError, description, ErrorType.Unexpected);

    /// <summary>
    /// Creates an <see cref="Error" /> of type <see cref="ErrorType.Validation" /> from a code and description.
    /// </summary>
    /// <param name="description">The error description.</param>
    public static Error Validation(string description = "A 'validation' error has occurred.") =>
        new(ErrorCodes.ValidationError, description, ErrorType.Validation);

    /// <summary>
    /// Creates an <see cref="Error" /> of type <see cref="ErrorType.NotFound" /> from a code and description.
    /// </summary>
    /// <param name="description">The error description.</param>
    public static Error NotFound(string description = "A 'Not Found' error has occurred.") =>
        new(ErrorCodes.NotFoundError, description, ErrorType.NotFound);

    /// <summary>
    /// Creates an <see cref="Error" /> with the given numeric <paramref name="type" />,
    /// <paramref name="code" />, and <paramref name="description" />.
    /// </summary>
    /// <param name="type">An integer value which represents the type of error that occurred.</param>
    /// <param name="code">The unique error code.</param>
    /// <param name="description">The error description.</param>
    public static Error Custom(ErrorType type, string code, string description) => new(code, description, type);


    public static Error FromStatusCode(int statusCode) =>
        statusCode switch
        {
            StatusCodes.Status401Unauthorized => Custom(ErrorType.Authentication, ErrorCodes.AuthenticationError, "You are not authenticated"),
            StatusCodes.Status403Forbidden => Custom(ErrorType.Authorization, ErrorCodes.AuthorizationError, "You are not authorized"),
            _ => Unexpected(description: "Unexpected error")
        };
}